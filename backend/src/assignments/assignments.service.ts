import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AssignmentsService {
  constructor(private prisma: PrismaService) {}

  async getAssignments(vendorId: string) {
    // Only return assignments where driver or vehicle belong to this vendor (or descendants)
    return this.prisma.driverVehicleAssignment.findMany({
      where: {
        OR: [
          { driver: { vendorId } },
          { vehicle: { vendorId } }
        ]
      },
      include: {
        driver: true,
        vehicle: true
      },
      orderBy: { assignedAt: 'desc' }
    });
  }

  async createAssignment(driverId: string, vehicleId: string, assignedBy: string) {
    // First, end any existing active assignments for this driver or vehicle
    await this.prisma.driverVehicleAssignment.updateMany({
      where: {
        OR: [{ driverId }, { vehicleId }],
        status: 'ACTIVE'
      },
      data: {
        status: 'ENDED',
        unassignedAt: new Date()
      }
    });

    // Create the new assignment
    return this.prisma.driverVehicleAssignment.create({
      data: {
        driverId,
        vehicleId,
        assignedBy,
        status: 'ACTIVE'
      },
      include: {
        driver: true,
        vehicle: true
      }
    });
  }

  async endAssignment(id: string) {
    return this.prisma.driverVehicleAssignment.update({
      where: { id },
      data: {
        status: 'ENDED',
        unassignedAt: new Date()
      }
    });
  }
}
