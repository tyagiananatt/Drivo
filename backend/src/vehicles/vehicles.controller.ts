import { Controller, Post, Body, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Permissions('VEHICLE_CREATE')
  @Post()
  async create(@Body() body: any, @CurrentUser() user: any) {
    return this.vehiclesService.create(user.vendorId, body);
  }

  @Permissions('VEHICLE_VIEW')
  @Get()
  async findAll(@CurrentUser() user: any) {
    return this.vehiclesService.findAll(user.vendorId);
  }

  @Permissions('VEHICLE_VIEW')
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.vehiclesService.findOne(id, user.vendorId);
  }

  @Permissions('VEHICLE_UPDATE')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any, @CurrentUser() user: any) {
    return this.vehiclesService.update(id, body, user.vendorId);
  }

  @Permissions('VEHICLE_UPDATE')
  @Post(':id/assign/:driverId')
  async assignDriver(
    @Param('id') vehicleId: string, 
    @Param('driverId') driverId: string,
    @CurrentUser() user: any
  ) {
    return this.vehiclesService.assignDriver(vehicleId, driverId, user.userId, user.vendorId);
  }
}
