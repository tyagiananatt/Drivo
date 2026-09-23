import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { PassportModule } from '@nestjs/passport';
import { VendorsModule } from '../vendors/vendors.module';

@Module({
  imports: [PassportModule, VendorsModule],
  providers: [DocumentsService],
  controllers: [DocumentsController],
  exports: [DocumentsService]
})
export class DocumentsModule {}
