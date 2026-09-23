import { Module } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { VendorsController } from './vendors.controller';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [PassportModule],
  providers: [VendorsService],
  controllers: [VendorsController],
  exports: [VendorsService]
})
export class VendorsModule {}
