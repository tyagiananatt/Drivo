import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, user, body, params } = req;
    
    // Only log mutations
    if (method === 'GET' || !user) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async (response) => {
        try {
          const entityMatch = url.match(/\/api\/([^\/]+)/);
          const entity = entityMatch ? entityMatch[1].toUpperCase() : 'UNKNOWN';
          const entityId = params.id || (response && response.id) || 'UNKNOWN_ID';
          
          let action = 'UPDATE';
          if (method === 'POST') action = 'CREATE';
          if (method === 'DELETE') action = 'DELETE';

          // Need user.id, but JWT might store it in userId
          const uid = user.userId || user.id;
          if (!uid) return;

          await this.prisma.auditLog.create({
            data: {
              userId: uid,
              vendorId: user.vendorId,
              action: action,
              entity: entity,
              entityId: entityId,
              newValue: JSON.stringify(body)
            }
          });
        } catch (error) {
          console.error('Failed to write audit log', error);
        }
      })
    );
  }
}
