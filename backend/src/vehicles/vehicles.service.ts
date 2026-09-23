import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VendorsService } from '../vendors/vendors.service';

@Injectable()
export class VehiclesService {
  constructor(
    private prisma: PrismaService,
    private vendorsService: VendorsService
  ) {}

  async create(vendorId: string, data: { 
    registrationNumber: string; manufacturer: string; 
    model: string; vehicleType: string; 
    seatingCapacity: number; fuelType: string; 
    manufacturingYear: number;
  }) {
    try {
      return await this.prisma.vehicle.create({
        data: {
          vendorId,
          registrationNumber: data.registrationNumber,
          manufacturer: data.manufacturer,
          model: data.model,
          vehicleType: data.vehicleType,
          seatingCapacity: data.seatingCapacity,
          fuelType: data.fuelType,
          manufacturingYear: data.manufacturingYear,
        }
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestException('A vehicle with this registration number already exists.');
      }
      throw error;
    }
  }

  async findAll(userVendorId: string) {
    const scope = await this.vendorsService.getAuthorizedScope(userVendorId);
    return this.prisma.vehicle.findMany({
      where: { vendorId: { in: scope } },
      include: { 
        documents: true, 
        assignments: { where: { status: 'ACTIVE' }, include: { driver: true } }, 
        vendor: { select: { name: true } } 
      }
    });
  }

  async findOne(id: string, userVendorId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: { 
        documents: true, 
        assignments: { where: { status: 'ACTIVE' }, include: { driver: true } },
        vendor: { select: { name: true } }
      }
    });
    if (!vehicle) throw new NotFoundException('Vehicle not found');

    const scope = await this.vendorsService.getAuthorizedScope(userVendorId);
    if (!scope.includes(vehicle.vendorId)) {
      throw new ForbiddenException('You do not have permission to access this vehicle.');
    }

    return vehicle;
  }

  async update(id: string, data: { status?: string }, userVendorId: string) {
    await this.findOne(id, userVendorId); // This checks scope internally
    return this.prisma.vehicle.update({
      where: { id },
      data
    });
  }

  async assignDriver(vehicleId: string, driverId: string, assignedBy: string, userVendorId: string) {
    const vehicle = await this.findOne(vehicleId, userVendorId);
    
    // Quick scope check for driver as well
    const driver = await this.prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) throw new NotFoundException('Driver not found');
    
    const scope = await this.vendorsService.getAuthorizedScope(userVendorId);
    if (!scope.includes(driver.vendorId)) {
      throw new ForbiddenException('You do not have permission to access this driver.');
    }

    await this.prisma.driverVehicleAssignment.updateMany({
      where: { vehicleId, status: 'ACTIVE' },
      data: { status: 'ENDED', unassignedAt: new Date() }
    });

    await this.prisma.driverVehicleAssignment.updateMany({
      where: { driverId, status: 'ACTIVE' },
      data: { status: 'ENDED', unassignedAt: new Date() }
    });

    return this.prisma.driverVehicleAssignment.create({
      data: {
        vehicleId,
        driverId,
        status: 'ACTIVE',
        assignedBy
      }
    });
  }
}
