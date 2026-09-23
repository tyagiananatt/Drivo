import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('api/assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Get()
  async getAssignments(@CurrentUser() user: any) {
    return this.assignmentsService.getAssignments(user.vendorId);
  }

  @Post()
  async createAssignment(
    @Body() body: { driverId: string, vehicleId: string },
    @CurrentUser() user: any
  ) {
    return this.assignmentsService.createAssignment(body.driverId, body.vehicleId, user.userId);
  }

  @Patch(':id/end')
  async endAssignment(@Param('id') id: string) {
    return this.assignmentsService.endAssignment(id);
  }
}
