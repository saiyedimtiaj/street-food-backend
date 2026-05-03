import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ComplaintsService } from './complaints.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Complaints')
@ApiBearerAuth()
@ApiCookieAuth()
@Controller('complaints')
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Post()
  @Roles('user')
  @ApiOperation({ summary: '[User] Submit a complaint about a store' })
  @ApiResponse({ status: 201, description: 'Complaint submitted' })
  @ApiResponse({ status: 409, description: 'Already submitted a complaint for this store' })
  async createComplaint(@CurrentUser() user: any, @Body() dto: CreateComplaintDto) {
    const data = await this.complaintsService.createComplaint(user.id, dto);
    return { message: 'Complaint submitted', data };
  }

  @Get('my')
  @Roles('user')
  @ApiOperation({ summary: '[User] Get my submitted complaints' })
  async getMyComplaints(@CurrentUser() user: any) {
    const data = await this.complaintsService.getMyComplaints(user.id);
    return { message: 'Your complaints', data };
  }

  @Get('my/store/:storeId')
  @Roles('user')
  @ApiOperation({ summary: '[User] Get my complaint for a specific store' })
  async getMyComplaintForStore(
    @CurrentUser() user: any,
    @Param('storeId', ParseUUIDPipe) storeId: string,
  ) {
    const data = await this.complaintsService.getMyComplaint(user.id, storeId);
    return { message: 'Complaint', data };
  }

  @Get('store/:storeId')
  @Roles('store')
  @ApiOperation({ summary: '[Store] Get all complaints for your store' })
  async getComplaintsByStore(
    @CurrentUser() user: any,
    @Param('storeId', ParseUUIDPipe) storeId: string,
  ) {
    const data = await this.complaintsService.getComplaintsByStore(storeId, user.id);
    return { message: 'Store complaints', data };
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: '[Admin] Get all complaints' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'resolved', 'dismissed'] })
  async getAllComplaints(@Query('status') status?: string) {
    const data = await this.complaintsService.getAllComplaints(status);
    return { message: 'All complaints', data };
  }

  @Patch(':id/resolve')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Admin] Mark a complaint as resolved' })
  async resolveComplaint(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('admin_note') adminNote?: string,
  ) {
    const data = await this.complaintsService.resolveComplaint(id, adminNote);
    return { message: 'Complaint resolved', data };
  }

  @Patch(':id/dismiss')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Admin] Dismiss a complaint' })
  async dismissComplaint(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('admin_note') adminNote?: string,
  ) {
    const data = await this.complaintsService.dismissComplaint(id, adminNote);
    return { message: 'Complaint dismissed', data };
  }
}
