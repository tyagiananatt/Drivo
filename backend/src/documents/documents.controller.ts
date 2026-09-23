import { Controller, Post, Body, Get, Param, Patch, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Permissions('DOCUMENT_UPLOAD')
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: any,
    @Body() body: any,
    @CurrentUser() user: any
  ) {
    if (!file) throw new BadRequestException('File is required');
    return this.documentsService.uploadDocument(file, {
      entityType: body.entityType,
      documentType: body.documentType,
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : undefined,
      driverId: body.driverId,
      vehicleId: body.vehicleId,
    }, user.vendorId);
  }

  @Permissions('DOCUMENT_VIEW')
  @Get(':id/url')
  async getUrl(@Param('id') id: string, @CurrentUser() user: any) {
    return this.documentsService.getDocumentUrl(id, user.vendorId);
  }

  @Permissions('DOCUMENT_VIEW')
  @Get()
  async getAll(@CurrentUser() user: any) {
    return this.documentsService.findAll(user.vendorId);
  }

  @Permissions('DOCUMENT_VERIFY')
  @Patch(':id/verify')
  async verify(
    @Param('id') id: string, 
    @Body('status') status: string,
    @CurrentUser() user: any
  ) {
    return this.documentsService.verifyDocument(id, status, user.userId, user.vendorId);
  }
}
