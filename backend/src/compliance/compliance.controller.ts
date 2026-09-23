import { Controller, Get, Post, UseGuards, ForbiddenException } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { VendorsService } from '../vendors/vendors.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/compliance')
export class ComplianceController {
  constructor(
    private readonly complianceService: ComplianceService,
    private readonly prisma: PrismaService,
    private readonly vendorsService: VendorsService
  ) {}

  @Permissions('COMPLIANCE_VIEW')
  @Get('alerts')
  async getAlerts(@CurrentUser() user: any) {
    const scope = await this.vendorsService.getAuthorizedScope(user.vendorId);
    
    // Fetch problematic documents
    const documents = await this.prisma.document.findMany({
      where: {
        status: { in: ['EXPIRED', 'PENDING', 'REJECTED'] },
        OR: [
          { vehicle: { vendorId: { in: scope } } },
          { driver: { vendorId: { in: scope } } }
        ]
      },
      include: {
        driver: { select: { name: true } },
        vehicle: { select: { registrationNumber: true } }
      }
    });

    // Fetch blocked entities
    const blockedDrivers = await this.prisma.driver.findMany({
      where: { vendorId: { in: scope }, status: 'BLOCKED' },
      select: { id: true, name: true, status: true }
    });

    const blockedVehicles = await this.prisma.vehicle.findMany({
      where: { vendorId: { in: scope }, status: 'BLOCKED' },
      select: { id: true, registrationNumber: true, status: true }
    });

    return {
      documents: documents.map(d => ({
        id: d.id,
        entityType: d.entityType,
        documentType: d.documentType,
        status: d.status,
        expiryDate: d.expiryDate,
        entityName: d.driver ? d.driver.name : (d.vehicle ? d.vehicle.registrationNumber : 'Unknown')
      })),
      blockedDrivers,
      blockedVehicles
    };
  }

  @Permissions('COMPLIANCE_VIEW')
  @Post('run-check')
  async runCheck() {
    await this.complianceService.checkDocumentExpirations();
    return { message: 'Compliance check ran successfully' };
  }
}
