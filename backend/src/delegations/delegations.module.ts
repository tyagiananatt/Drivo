import { Module } from '@nestjs/common';
import { DelegationsService } from './delegations.service';
import { DelegationsController } from './delegations.controller';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [PassportModule],
  providers: [DelegationsService],
  controllers: [DelegationsController],
  exports: [DelegationsService]
})
export class DelegationsModule {}
