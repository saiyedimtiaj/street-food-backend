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
import { ClaimsService } from './claims.service';
import { CreateClaimDto } from './dto/create-claim.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Claims')
@ApiBearerAuth()
@ApiCookieAuth()
@Controller('claims')
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Post()
  @Roles('store')
  @ApiOperation({ summary: '[Store] Submit a claim for an unclaimed store' })
  @ApiResponse({ status: 201, description: 'Claim submitted' })
  @ApiResponse({ status: 409, description: 'Store already claimed or duplicate claim' })
  async createClaim(@CurrentUser() user: any, @Body() dto: CreateClaimDto) {
    const data = await this.claimsService.createClaim(user.id, dto);
    return { message: 'Claim submitted', data };
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: '[Admin] Get all store claims' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'approved', 'rejected'] })
  @ApiResponse({ status: 200, description: 'All claims' })
  async getAllClaims(@Query('status') status?: string) {
    const data = await this.claimsService.getAllClaims(status);
    return { message: 'Claims retrieved', data };
  }

  @Patch(':id/approve')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Admin] Approve a claim — links store to owner' })
  @ApiResponse({ status: 200, description: 'Claim approved, store linked' })
  async approveClaim(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('admin_note') adminNote?: string,
  ) {
    return this.claimsService.approveClaim(id, adminNote);
  }

  @Patch(':id/reject')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Admin] Reject a claim' })
  @ApiResponse({ status: 200, description: 'Claim rejected' })
  async rejectClaim(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('admin_note') adminNote?: string,
  ) {
    const data = await this.claimsService.rejectClaim(id, adminNote);
    return { message: 'Claim rejected', data };
  }
}
