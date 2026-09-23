import { Module } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { VehiclesController } from './vehicles.controller';
import { PassportModule } from '@nestjs/passport';
import { VendorsModule } from '../vendors/vendors.module';

@Module({
  imports: [PassportModule, VendorsModule],
  providers: [VehiclesService],
  controllers: [VehiclesController],
  exports: [VehiclesService]
})
export class VehiclesModule {}
