import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DelegationsService {
  constructor(private prisma: PrismaService) {}

  async create(data: { fromVendorId: string, toVendorId: string, permissionId: string, endDate?: Date }, createdBy: string) {
    if (data.fromVendorId === data.toVendorId) {
      throw new BadRequestException('Cannot delegate to self');
    }

    const descendants: any[] = await this.prisma.$queryRaw`
      WITH RECURSIVE VendorHierarchy AS (
        SELECT v.* 
        FROM "Vendor" v 
        WHERE v.id = ${data.fromVendorId}
        UNION ALL
        SELECT child.* 
        FROM "Vendor" child
        INNER JOIN VendorHierarchy parent ON child."parentId" = parent.id
      )
      SELECT id FROM VendorHierarchy WHERE id != ${data.fromVendorId};
    `;

    const isDescendant = descendants.some(d => d.id === data.toVendorId);
    if (!isDescendant) {
      throw new BadRequestException('Can only delegate permissions to descendant vendors');
    }

    return this.prisma.delegation.create({
      data: {
        fromVendorId: data.fromVendorId,
        toVendorId: data.toVendorId,
        permissionId: data.permissionId,
        endDate: data.endDate,
        createdBy,
      }
    });
  }

  async getDelegations(vendorId: string) {
    return this.prisma.delegation.findMany({
      where: {
        OR: [
          { fromVendorId: vendorId },
          { toVendorId: vendorId }
        ]
      },
      include: { permission: true, fromVendor: true, toVendor: true }
    });
  }

  async revoke(id: string) {
    return this.prisma.delegation.update({
      where: { id },
      data: { status: 'REVOKED' }
    });
  }

  async update(id: string, endDate: Date) {
    return this.prisma.delegation.update({
      where: { id },
      data: { endDate }
    });
  }

  async getAvailablePermissions() {
    return this.prisma.permission.findMany({
      select: { id: true, name: true, description: true }
    });
  }
}
