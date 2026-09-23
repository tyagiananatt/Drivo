import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkDocumentExpirations() {
    this.logger.log('Running daily compliance check for expired documents...');

    const expiredDocuments = await this.prisma.document.findMany({
      where: {
        expiryDate: { lt: new Date() },
        status: { not: 'EXPIRED' }
      },
      include: { driver: true, vehicle: true }
    });

    if (expiredDocuments.length === 0) {
      this.logger.log('No new expired documents found.');
      return;
    }

    for (const doc of expiredDocuments) {
      // Mark Document as Expired
      await this.prisma.document.update({
        where: { id: doc.id },
        data: { status: 'EXPIRED' }
      });

      // Mark corresponding Driver or Vehicle as non-compliant (BLOCKED)
      if (doc.driverId && doc.driver) {
        await this.prisma.driver.update({
          where: { id: doc.driverId },
          data: { status: 'BLOCKED' }
        });
        this.logger.log(`Driver ${doc.driverId} blocked due to expired document.`);
        
        await this.notifyVendor(doc.driver.vendorId, 'COMPLIANCE_ALERT', 'Driver Blocked', `Driver ${doc.driver.name} has been blocked due to an expired document.`);
      }

      if (doc.vehicleId && doc.vehicle) {
        await this.prisma.vehicle.update({
          where: { id: doc.vehicleId },
          data: { status: 'BLOCKED' }
        });
        this.logger.log(`Vehicle ${doc.vehicleId} blocked due to expired document.`);

        await this.notifyVendor(doc.vehicle.vendorId, 'COMPLIANCE_ALERT', 'Vehicle Blocked', `Vehicle ${doc.vehicle.registrationNumber} has been blocked due to an expired document.`);
      }
    }
  }

  private async notifyVendor(vendorId: string, type: string, title: string, message: string) {
    const users = await this.prisma.user.findMany({ where: { vendorId } });
    
    const notifications = users.map(u => ({
      userId: u.id,
      type,
      title,
      message,
    }));

    if (notifications.length > 0) {
      await this.prisma.notification.createMany({ data: notifications });
    }
  }
}
