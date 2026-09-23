import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production',
    });
  }

  async validate(payload: any) {
    // Check if the user actually still exists in the database
    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId }
    });

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    // This payload is injected into req.user
    return { 
      userId: payload.userId, 
      vendorId: payload.vendorId, 
      role: payload.role 
    };
  }
}
