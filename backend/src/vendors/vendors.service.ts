import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import * as bcrypt from 'bcrypt';

@Injectable()
export class VendorsService {
  constructor(private prisma: PrismaService) {}

  async findAllForAdmin() {
    return this.prisma.vendor.findMany({
      include: {
        _count: {
          select: { users: true, drivers: true, vehicles: true, trips: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async deleteVendorAdmin(id: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id } });
    if (!vendor) throw new BadRequestException('Vendor not found');

    // Thanks to Prisma's onDelete: Cascade, deleting the vendor will delete all nested relations automatically!
    await this.prisma.vendor.delete({ where: { id } });
    return { success: true, message: 'Vendor and all associated data deleted successfully' };
  }

  async create(data: { name: string; email: string; parentId?: string; firstName?: string; lastName?: string; password?: string }) {
    let level = 0;
    if (data.parentId) {
      const parent = await this.prisma.vendor.findUnique({ where: { id: data.parentId } });
      if (!parent) throw new BadRequestException('Parent vendor not found');
      level = parent.level + 1;
    }

    const vendor = await this.prisma.vendor.create({
      data: {
        name: data.name,
        email: data.email,
        parentId: data.parentId,
        level,
      }
    });

    if (data.password) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      let role = await this.prisma.role.findUnique({ where: { name: 'SUB_VENDOR' } });
      if (!role) {
        role = await this.prisma.role.create({ data: { name: 'SUB_VENDOR' } });
      }

      await this.prisma.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          firstName: data.firstName || 'Sub',
          lastName: data.lastName || 'Vendor',
          roleId: role.id,
          vendorId: vendor.id,
        }
      });
    }

    return vendor;
  }

  async update(id: string, data: { name?: string; status?: string }, userVendorId: string) {
    const scope = await this.getAuthorizedScope(userVendorId);
    if (!scope.includes(id)) throw new ForbiddenException('Not allowed to update this vendor');

    return this.prisma.vendor.update({
      where: { id },
      data,
    });
  }

  async deactivate(id: string, userVendorId: string) {
    const scope = await this.getAuthorizedScope(userVendorId);
    if (!scope.includes(id)) throw new ForbiddenException('Not allowed to deactivate this vendor');

    return this.prisma.vendor.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
  }

  async getVendor(id: string, userVendorId: string) {
    const scope = await this.getAuthorizedScope(userVendorId);
    if (!scope.includes(id)) throw new ForbiddenException('Not allowed to view this vendor');

    return this.prisma.vendor.findUnique({ where: { id } });
  }

  async getDirectChildren(parentId: string, userVendorId: string) {
    const scope = await this.getAuthorizedScope(userVendorId);
    if (!scope.includes(parentId)) throw new ForbiddenException('Not allowed to view this vendor');

    return this.prisma.vendor.findMany({ where: { parentId } });
  }

  async getAllDescendants(id: string, userVendorId?: string) {
    if (userVendorId) {
      const scope = await this.getAuthorizedScope(userVendorId);
      if (!scope.includes(id)) throw new ForbiddenException('Not allowed to view descendants of this vendor');
    }

    const result = await this.prisma.$queryRaw`
      WITH RECURSIVE VendorHierarchy AS (
        SELECT v.* 
        FROM "Vendor" v 
        WHERE v.id = ${id}
        
        UNION ALL
        
        SELECT child.* 
        FROM "Vendor" child
        INNER JOIN VendorHierarchy parent ON child."parentId" = parent.id
      )
      SELECT * FROM VendorHierarchy WHERE id != ${id};
    `;
    return result;
  }

  async getAuthorizedScope(vendorId: string): Promise<string[]> {
    const descendants: any[] = (await this.getAllDescendants(vendorId)) as any[];
    return [vendorId, ...descendants.map(d => d.id)];
  }

  async getAncestors(id: string, userVendorId: string) {
    const scope = await this.getAuthorizedScope(userVendorId);
    if (!scope.includes(id)) throw new ForbiddenException('Not allowed to view ancestors of this vendor');

    const result = await this.prisma.$queryRaw`
      WITH RECURSIVE VendorAncestors AS (
        SELECT v.* 
        FROM "Vendor" v 
        WHERE v.id = ${id}
        
        UNION ALL
        
        SELECT parent.* 
        FROM "Vendor" parent
        INNER JOIN VendorAncestors child ON child."parentId" = parent.id
      )
      SELECT * FROM VendorAncestors WHERE id != ${id};
    `;
    return result;
  }

  async getVendorTree(rootId: string, userVendorId: string) {
    const descendants: any[] = (await this.getAllDescendants(rootId, userVendorId)) as any[];
    const root = await this.getVendor(rootId, userVendorId);
    
    if (!root) throw new BadRequestException('Root vendor not found');

    const allNodes = [root, ...descendants];
    const map = new Map();
    allNodes.forEach(node => map.set(node.id, { ...node, children: [] }));
    
    const tree: any[] = [];
    map.forEach(node => {
      if (node.parentId && map.has(node.parentId)) {
        map.get(node.parentId).children.push(node);
      } else {
        tree.push(node);
      }
    });
    return tree[0];
  }

  async moveVendor(id: string, newParentId: string, userVendorId: string) {
    if (id === newParentId) throw new BadRequestException('Vendor cannot be its own parent');
    
    const scope = await this.getAuthorizedScope(userVendorId);
    if (!scope.includes(id) || !scope.includes(newParentId)) {
      throw new ForbiddenException('Not allowed to move these vendors');
    }

    const descendants: any[] = (await this.getAllDescendants(id)) as any[];
    if (descendants.some(d => d.id === newParentId)) {
      throw new BadRequestException('Cannot move a vendor underneath its own descendant (circular hierarchy)');
    }

    const newParent = await this.prisma.vendor.findUnique({ where: { id: newParentId } });
    if (!newParent) throw new BadRequestException('New parent not found');

    return this.prisma.vendor.update({
      where: { id },
      data: { parentId: newParentId, level: newParent.level + 1 }
    });
  }

  async getSuperVendorName(vendorId: string): Promise<string | null> {
    const ancestors = await this.prisma.$queryRaw`
      WITH RECURSIVE VendorAncestors AS (
        SELECT id, name, "parentId", level FROM "Vendor" WHERE id = ${vendorId}
        UNION ALL
        SELECT parent.id, parent.name, parent."parentId", parent.level 
        FROM "Vendor" parent
        INNER JOIN VendorAncestors child ON child."parentId" = parent.id
      )
      SELECT name FROM VendorAncestors WHERE level = 0 LIMIT 1;
    `;
    if (ancestors && (ancestors as any[]).length > 0) {
      return (ancestors as any[])[0].name;
    }
    return null;
  }

  async getDirectParentName(parentId: string): Promise<string | null> {
    const parent = await this.prisma.vendor.findUnique({
      where: { id: parentId },
      select: { name: true }
    });
    return parent ? parent.name : null;
  }

  async getDashboardStats(vendorId: string, requestorVendorId?: string) {
    if (requestorVendorId && vendorId !== requestorVendorId) {
      const authScope = await this.getAuthorizedScope(requestorVendorId);
      if (!authScope.includes(vendorId)) {
        throw new ForbiddenException('Not allowed to view stats for this vendor');
      }
    }

    const scope = await this.getAuthorizedScope(vendorId);
    
    // Vehicles
    const vehicles = await this.prisma.vehicle.findMany({ where: { vendorId: { in: scope } }, select: { status: true, registrationNumber: true, createdAt: true, vehicleType: true } });
    const totalVehicles = vehicles.length;
    const vehicleStatusBreakdown = {
      active: vehicles.filter(v => v.status === 'ACTIVE').length,
      pending: vehicles.filter(v => v.status === 'PENDING').length,
      inactive: vehicles.filter(v => v.status === 'INACTIVE').length,
    };

    // Drivers
    const drivers = await this.prisma.driver.findMany({ 
      where: { vendorId: { in: scope } }, 
      select: { 
        status: true, 
        name: true, 
        createdAt: true,
        assignments: { where: { status: 'ACTIVE' } }
      } 
    });
    const activeDrivers = drivers.filter(d => d.status === 'ACTIVE').length;
    const driverAssignment = {
      assigned: drivers.filter(d => d.status === 'ACTIVE' && d.assignments.length > 0).length,
      unassigned: drivers.filter(d => d.status === 'ACTIVE' && d.assignments.length === 0).length,
    };

    const subVendors = scope.length - 1;

    // Recent Onboardings
    const recentVehicles = vehicles.map(v => ({ type: 'Vehicle', name: v.registrationNumber, detail: v.vehicleType, status: v.status, date: v.createdAt }));
    const recentDrivers = drivers.map(d => ({ type: 'Driver', name: d.name, detail: d.assignments.length > 0 ? 'Assigned' : 'Unassigned', status: d.status, date: d.createdAt }));
    
    const recentOnboardings = [...recentVehicles, ...recentDrivers]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5);

    const tree: any = await this.getVendorTree(vendorId, vendorId);
    let superVendorName = null;
    let directParentName = null;
    if (tree && tree.level > 0) {
      superVendorName = await this.getSuperVendorName(vendorId);
      if (tree.parentId) {
        directParentName = await this.getDirectParentName(tree.parentId);
      }
    }

    // Chart 1: Fleet Growth (Last 6 Months)
    const fleetGrowthMap: { [key: string]: number } = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      fleetGrowthMap[d.toLocaleString('default', { month: 'short' })] = 0;
    }
    vehicles.forEach(v => {
      const m = v.createdAt.toLocaleString('default', { month: 'short' });
      if (fleetGrowthMap[m] !== undefined) fleetGrowthMap[m]++;
    });

    // Chart 2: Vehicle Type Distribution
    const vehicleTypeMap: { [key: string]: number } = {};
    vehicles.forEach(v => {
      vehicleTypeMap[v.vehicleType] = (vehicleTypeMap[v.vehicleType] || 0) + 1;
    });

    // Chart 3: Compliance Status
    const documents = await this.prisma.document.findMany({
      where: {
        OR: [
          { vehicle: { vendorId: { in: scope } } },
          { driver: { vendorId: { in: scope } } }
        ]
      },
      select: { status: true }
    });
    
    const complianceMap = { 'VERIFIED': 0, 'PENDING': 0, 'EXPIRED': 0, 'REJECTED': 0 };
    let complianceAlerts = 0;
    documents.forEach(d => {
      if (d.status === 'EXPIRED' || d.status === 'REJECTED') complianceAlerts++;
      if ((complianceMap as any)[d.status] !== undefined) (complianceMap as any)[d.status]++;
    });

    return {
      totalVehicles,
      activeDrivers,
      complianceAlerts,
      subVendors,
      superVendorName,
      directParentName,
      vehicleStatusBreakdown,
      driverAssignment,
      recentOnboardings,
      charts: {
        fleetGrowth: {
          labels: Object.keys(fleetGrowthMap),
          data: Object.values(fleetGrowthMap)
        },
        vehicleTypes: {
          labels: Object.keys(vehicleTypeMap),
          data: Object.values(vehicleTypeMap)
        },
        compliance: {
          labels: Object.keys(complianceMap),
          data: Object.values(complianceMap)
        }
      }
    };
  }
}
