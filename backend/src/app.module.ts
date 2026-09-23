import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { VendorsModule } from './vendors/vendors.module';
import { DelegationsModule } from './delegations/delegations.module';
import { DriversModule } from './drivers/drivers.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { DocumentsModule } from './documents/documents.module';
import { ComplianceModule } from './compliance/compliance.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuditInterceptor } from './auth/interceptors/audit.interceptor';
import { AssignmentsModule } from './assignments/assignments.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule, 
    AuthModule, 
    VendorsModule, 
    DelegationsModule,
    DriversModule,
    VehiclesModule,
    DocumentsModule,
    ComplianceModule,
    NotificationsModule,
    AssignmentsModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    }
  ],
})
export class AppModule {}
