import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Admin')
@ApiBearerAuth()
@ApiCookieAuth()
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: '[Admin] Get platform dashboard statistics' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics',
    schema: {
      example: {
        totalUsers: 150,
        totalStores: 42,
        totalReviews: 380,
        pendingSuggestions: 5,
        pendingClaims: 3,
        activeStores: 40,
      },
    },
  })
  async getDashboardStats() {
    const data = await this.adminService.getDashboardStats();
    return { message: 'Dashboard statistics', data };
  }

  @Patch('stores/:id/suspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Admin] Suspend a store' })
  @ApiResponse({ status: 200, description: 'Store suspended' })
  async suspendStore(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.adminService.suspendStore(id);
    return { message: 'Store suspended', data };
  }

  @Patch('stores/:id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Admin] Activate a suspended store' })
  @ApiResponse({ status: 200, description: 'Store activated' })
  async activateStore(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.adminService.activateStore(id);
    return { message: 'Store activated', data };
  }
}
