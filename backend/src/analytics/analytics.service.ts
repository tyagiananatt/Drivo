import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardMetrics(vendorId: string) {
    if (!vendorId) {
      return { onlineDrivers: 0, activeTrips: 0, totalRevenue: 0 };
    }

    // 1. Online Drivers
    const onlineDrivers = await this.prisma.driver.count({
      where: { vendorId, isOnline: true }
    });

    // 2. Active Trips
    const activeTrips = await this.prisma.trip.count({
      where: { vendorId, status: 'ACTIVE' }
    });

    // 3. Total Revenue (sum of all completed trip prices or payments)
    const completedTrips = await this.prisma.trip.findMany({
      where: { vendorId, status: 'COMPLETED' },
      select: { estimatedPrice: true }
    });
    const totalRevenue = completedTrips.reduce((acc, trip) => acc + (trip.estimatedPrice || 0), 0);

    return {
      onlineDrivers,
      activeTrips,
      totalRevenue
    };
  }
}
