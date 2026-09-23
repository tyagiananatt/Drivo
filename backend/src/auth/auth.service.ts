import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      userId: user.id,
      vendorId: user.vendorId,
      role: user.role.name,
    };

    let userPermissions = user.role.permissions.map((rp: any) => rp.permission.name);
    
    // Merge delegations if not SUPER_VENDOR
    if (user.role.name !== 'SUPER_VENDOR' && user.role.name !== 'SUPER_ADMIN' && user.vendorId) {
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
      const delegated = activeDelegations.map(d => d.permission.name);
      userPermissions = [...new Set([...userPermissions, ...delegated])];
    } else if (user.role.name === 'SUPER_VENDOR' || user.role.name === 'SUPER_ADMIN') {
      // Super vendor has all standard permissions basically. We'll signify this by a special flag.
      userPermissions = ['*']; 
    }

    return {
      success: true,
      data: {
        access_token: this.jwtService.sign(payload),
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          vendorId: user.vendorId,
          role: user.role.name,
          permissions: userPermissions,
        }
      },
    };
  }

  async register(data: any) {
    const existingUser = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new UnauthorizedException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    let role = await this.prisma.role.findUnique({ where: { name: 'SUPER_VENDOR' } });
    if (!role) {
      role = await this.prisma.role.create({ data: { name: 'SUPER_VENDOR' } });
    }

    const vendor = await this.prisma.vendor.create({
      data: {
        name: data.companyName || 'My Fleet Company',
        email: data.email,
        level: 0,
      }
    });

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        roleId: role.id,
        vendorId: vendor.id,
      }
    });

    return this.login(data.email, data.password);
  }

  async getFullProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        vendor: true,
      }
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.name,
      joinedAt: user.createdAt,
      status: 'ACTIVE', // Assuming active if they can log in
      vendor: user.vendor ? {
        id: user.vendor.id,
        name: user.vendor.name,
        level: user.vendor.level,
        status: user.vendor.status,
        joinedAt: user.vendor.createdAt,
      } : null
    };
  }
}
