import { Controller, Post, Body, Get, Param, Patch, UseGuards, Delete } from '@nestjs/common';
import { DelegationsService } from './delegations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('api/delegations')
export class DelegationsController {
  constructor(private readonly delegationsService: DelegationsService) {}

  @Permissions('DELEGATION_CREATE')
  @Post()
  async create(@Body() body: any, @CurrentUser() user: any) {
    if (!body.fromVendorId) {
      body.fromVendorId = user.vendorId;
    }
    return this.delegationsService.create(body, user.userId);
  }

  @Permissions('DELEGATION_VIEW')
  @Get('vendor/:vendorId')
  async getDelegations(@Param('vendorId') vendorId: string) {
    return this.delegationsService.getDelegations(vendorId);
  }

  @Permissions('DELEGATION_REVOKE')
  @Delete(':id')
  async revoke(@Param('id') id: string) {
    return this.delegationsService.revoke(id);
  }

  @Permissions('DELEGATION_CREATE') // Or DELEGATION_UPDATE if defined
  @Patch(':id')
  async update(@Param('id') id: string, @Body('endDate') endDate: string) {
    return this.delegationsService.update(id, new Date(endDate));
  }

  @Get('permissions')
  async getAvailablePermissions() {
    return this.delegationsService.getAvailablePermissions();
  }
}
