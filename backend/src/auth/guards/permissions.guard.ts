import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredPermissions) {
      return true;
    }
    
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user || !user.role || !user.vendorId) {
      throw new ForbiddenException('User context or vendor missing');
    }

    if (user.role === 'SUPER_ADMIN' || user.role === 'SUPER_VENDOR') {
      return true;
    }

    const role = await this.prisma.role.findUnique({
      where: { name: user.role },
      include: { permissions: { include: { permission: true } } },
    });

    if (!role) {
      throw new ForbiddenException('Role not found in system');
    }

    const userPermissions = role.permissions.map((rp: any) => rp.permission.name);
    let hasPermission = requiredPermissions.some(rp => userPermissions.includes(rp));

    // If role doesn't have permission, check delegations
    if (!hasPermission) {
      const activeDelegations = await this.prisma.delegation.findMany({
        where: {
          toVendorId: user.vendorId,
          status: 'ACTIVE',
          startDate: { lte: new Date() },
          OR: [
            { endDate: null },
            { endDate: { gte: new Date() } }
          ]
        },
        include: { permission: true }
      });

      const delegatedPermissions = activeDelegations.map(d => d.permission.name);
      hasPermission = requiredPermissions.some(rp => delegatedPermissions.includes(rp));
    }
    
    if (!hasPermission) {
      throw new ForbiddenException(`Requires one of the following permissions: ${requiredPermissions.join(', ')}`);
    }

    return true;
  }
}
