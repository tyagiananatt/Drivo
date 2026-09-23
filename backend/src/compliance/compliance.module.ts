import { Module } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { ComplianceController } from './compliance.controller';
import { PassportModule } from '@nestjs/passport';
import { VendorsModule } from '../vendors/vendors.module';

@Module({
  imports: [PassportModule, VendorsModule],
  controllers: [ComplianceController],
  providers: [ComplianceService],
})
export class ComplianceModule {}
