import { Injectable, InternalServerErrorException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VendorsService } from '../vendors/vendors.service';
import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DocumentsService {
  private minioClient: Minio.Client;
  private bucketName = process.env.MINIO_BUCKET_NAME || 'fleet-documents';

  constructor(
    private prisma: PrismaService,
    private vendorsService: VendorsService
  ) {
    this.minioClient = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000'),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ROOT_USER || 'admin',
      secretKey: process.env.MINIO_ROOT_PASSWORD || 'password',
    });
    this.initBucket();
  }

  private async initBucket() {
    try {
      const exists = await this.minioClient.bucketExists(this.bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
      }
    } catch (error) {
      console.error('Error initializing MinIO bucket:', error);
    }
  }

  async uploadDocument(file: any, data: { entityType: string, documentType: string, expiryDate?: Date, driverId?: string, vehicleId?: string }, userVendorId: string) {
    if (!data.driverId && !data.vehicleId) {
      throw new Error('Document must be attached to a driver or vehicle');
    }

    let vendorIdToCheck = '';
    if (data.driverId) {
      const driver = await this.prisma.driver.findUnique({ where: { id: data.driverId } });
      if (!driver) throw new NotFoundException('Driver not found');
      vendorIdToCheck = driver.vendorId;
    } else if (data.vehicleId) {
      const vehicle = await this.prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
      if (!vehicle) throw new NotFoundException('Vehicle not found');
      vendorIdToCheck = vehicle.vendorId;
    }

    const scope = await this.vendorsService.getAuthorizedScope(userVendorId);
    if (!scope.includes(vendorIdToCheck)) {
      throw new ForbiddenException('You do not have permission to attach documents to this entity.');
    }

    const objectName = `${uuidv4()}-${file.originalname}`;
    
    try {
      await this.minioClient.putObject(this.bucketName, objectName, file.buffer, file.size, {
        'Content-Type': file.mimetype
      });
    } catch (err) {
      throw new InternalServerErrorException('File upload failed');
    }

    return this.prisma.document.create({
      data: {
        entityType: data.entityType,
        documentType: data.documentType,
        fileUrl: objectName, // Store object key here
        status: 'PENDING',
        expiryDate: data.expiryDate,
        driverId: data.driverId,
        vehicleId: data.vehicleId,
      }
    });
  }

  async getDocumentUrl(id: string, userVendorId: string) {
    const doc = await this.prisma.document.findUnique({ 
      where: { id },
      include: { driver: true, vehicle: true } 
    });
    if (!doc) throw new NotFoundException('Document not found');
    
    const vendorIdToCheck = doc.driver ? doc.driver.vendorId : (doc.vehicle ? doc.vehicle.vendorId : null);
    
    if (vendorIdToCheck) {
      const scope = await this.vendorsService.getAuthorizedScope(userVendorId);
      if (!scope.includes(vendorIdToCheck)) {
        throw new ForbiddenException('You do not have permission to view this document.');
      }
    }

    const url = await this.minioClient.presignedGetObject(this.bucketName, doc.fileUrl, 24 * 60 * 60);
    return { url };
  }

  async verifyDocument(id: string, status: string, verifiedBy: string, userVendorId: string) {
    const doc = await this.prisma.document.findUnique({ 
      where: { id },
      include: { driver: true, vehicle: true } 
    });
    if (!doc) throw new NotFoundException('Document not found');
    
    const vendorIdToCheck = doc.driver ? doc.driver.vendorId : (doc.vehicle ? doc.vehicle.vendorId : null);
    
    if (vendorIdToCheck) {
      const scope = await this.vendorsService.getAuthorizedScope(userVendorId);
      if (!scope.includes(vendorIdToCheck)) {
        throw new ForbiddenException('You do not have permission to verify this document.');
      }
    }

    return this.prisma.document.update({
      where: { id },
      data: { status, verifiedBy, verifiedAt: new Date() }
    });
  }

  async findAll(userVendorId: string) {
    const scope = await this.vendorsService.getAuthorizedScope(userVendorId);
    
    return this.prisma.document.findMany({
      where: {
        OR: [
          { driver: { vendorId: { in: scope } } },
          { vehicle: { vendorId: { in: scope } } }
        ]
      },
      include: {
        driver: { select: { name: true, vendor: { select: { name: true } } } },
        vehicle: { select: { registrationNumber: true, vendor: { select: { name: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
