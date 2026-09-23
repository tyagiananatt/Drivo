import { Controller, Post, Body, Get, Param, Patch, UseGuards, Delete, Request } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('api/vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Roles('SUPER_ADMIN')
  @Get('all')
  async getAllVendors() {
    return this.vendorsService.findAllForAdmin();
  }

  @Roles('SUPER_ADMIN')
  @Delete(':id')
  async deleteVendor(@Param('id') id: string) {
    return this.vendorsService.deleteVendorAdmin(id);
  }

  @Permissions('VENDOR_CREATE')
  @Post()
  async create(@Body() body: any, @Request() req: any) {
    if (!body.parentId) {
      body.parentId = req.user.vendorId;
    }
    return this.vendorsService.create(body);
  }

  @Permissions('VENDOR_VIEW')
  @Get('my-tree')
  async getMyTree(@Request() req: any) {
    const vendorId = req.user.vendorId;
    return this.vendorsService.getVendorTree(vendorId, vendorId);
  }

  @Permissions('VENDOR_VIEW')
  @Get('stats')
  async getStats(@Request() req: any) {
    return this.vendorsService.getDashboardStats(req.user.vendorId);
  }

  @Permissions('VENDOR_VIEW')
  @Get(':id/stats')
  async getVendorStats(@Param('id') id: string, @Request() req: any) {
    return this.vendorsService.getDashboardStats(id, req.user.vendorId);
  }

  @Permissions('VENDOR_VIEW')
  @Get(':id')
  async getVendor(@Param('id') id: string, @Request() req: any) {
    return this.vendorsService.getVendor(id, req.user.vendorId);
  }

  @Permissions('VENDOR_UPDATE')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.vendorsService.update(id, body, req.user.vendorId);
  }

  @Permissions('VENDOR_DELETE')
  @Delete(':id')
  async deactivate(@Param('id') id: string, @Request() req: any) {
    return this.vendorsService.deactivate(id, req.user.vendorId);
  }

  @Permissions('VENDOR_VIEW')
  @Get(':id/children')
  async getChildren(@Param('id') id: string, @Request() req: any) {
    return this.vendorsService.getDirectChildren(id, req.user.vendorId);
  }

  @Permissions('VENDOR_VIEW')
  @Get(':id/descendants')
  async getDescendants(@Param('id') id: string, @Request() req: any) {
    return this.vendorsService.getAllDescendants(id, req.user.vendorId);
  }

  @Permissions('VENDOR_VIEW')
  @Get(':id/ancestors')
  async getAncestors(@Param('id') id: string, @Request() req: any) {
    return this.vendorsService.getAncestors(id, req.user.vendorId);
  }

  @Permissions('VENDOR_VIEW')
  @Get(':id/tree')
  async getTree(@Param('id') id: string, @Request() req: any) {
    return this.vendorsService.getVendorTree(id, req.user.vendorId);
  }

  @Permissions('VENDOR_UPDATE')
  @Post(':id/move')
  async move(@Param('id') id: string, @Body('newParentId') newParentId: string, @Request() req: any) {
    return this.vendorsService.moveVendor(id, newParentId, req.user.vendorId);
  }
}
