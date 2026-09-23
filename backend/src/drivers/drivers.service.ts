import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VendorsService } from '../vendors/vendors.service';

@Injectable()
export class DriversService {
  constructor(
    private prisma: PrismaService,
    private vendorsService: VendorsService
  ) {}

  async create(vendorId: string, data: { 
    name: string; email: string; phone: string; 
    dateOfBirth: Date; address: string; 
    emergencyContact: string; licenseNumber: string; 
    licenseExpiryDate: Date 
  }) {
    return this.prisma.driver.create({
      data: {
        vendorId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth,
        address: data.address,
        emergencyContact: data.emergencyContact,
        licenseNumber: data.licenseNumber,
        licenseExpiryDate: data.licenseExpiryDate,
      }
    });
  }

  async findAll(userVendorId: string) {
    const scope = await this.vendorsService.getAuthorizedScope(userVendorId);
    return this.prisma.driver.findMany({
      where: { vendorId: { in: scope } },
      include: { 
        documents: true, 
        assignments: { where: { status: 'ACTIVE' }, include: { vehicle: true } }, 
        vendor: { select: { name: true } } 
      }
    });
  }

  async findOne(id: string, userVendorId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { id },
      include: { 
        documents: true, 
        assignments: { where: { status: 'ACTIVE' }, include: { vehicle: true } },
        vendor: { select: { name: true } }
      }
    });
    if (!driver) throw new NotFoundException('Driver not found');
    
    const scope = await this.vendorsService.getAuthorizedScope(userVendorId);
    if (!scope.includes(driver.vendorId)) {
      throw new ForbiddenException('You do not have permission to access this driver.');
    }
    
    return driver;
  }

  async update(id: string, data: { name?: string, licenseNumber?: string, status?: string }, userVendorId: string) {
    await this.findOne(id, userVendorId); // Check scope
    return this.prisma.driver.update({
      where: { id },
      data
    });
  }
}
