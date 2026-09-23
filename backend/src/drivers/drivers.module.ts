import { Module } from '@nestjs/common';
import { DriversService } from './drivers.service';
import { DriversController } from './drivers.controller';
import { PassportModule } from '@nestjs/passport';
import { VendorsModule } from '../vendors/vendors.module';

@Module({
  imports: [PassportModule, VendorsModule],
  providers: [DriversService],
  controllers: [DriversController],
  exports: [DriversService]
})
export class DriversModule {}
