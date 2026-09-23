import { Controller, Post, Body, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { DriversService } from './drivers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/drivers')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Permissions('DRIVER_CREATE')
  @Post()
  async create(@Body() body: any, @CurrentUser() user: any) {
    return this.driversService.create(user.vendorId, body);
  }

  @Permissions('DRIVER_VIEW')
  @Get()
  async findAll(@CurrentUser() user: any) {
    return this.driversService.findAll(user.vendorId);
  }

  @Permissions('DRIVER_VIEW')
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.driversService.findOne(id, user.vendorId);
  }

  @Permissions('DRIVER_UPDATE')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any, @CurrentUser() user: any) {
    return this.driversService.update(id, body, user.vendorId);
  }
}
