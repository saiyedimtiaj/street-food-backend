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
import { SuggestionsService } from './suggestions.service';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Suggestions')
@ApiBearerAuth()
@ApiCookieAuth()
@Controller('suggestions')
export class SuggestionsController {
  constructor(private readonly suggestionsService: SuggestionsService) {}

  @Post()
  @Roles('user')
  @ApiOperation({ summary: '[User] Submit a store suggestion' })
  @ApiResponse({ status: 201, description: 'Suggestion submitted' })
  async createSuggestion(
    @CurrentUser() user: any,
    @Body() dto: CreateSuggestionDto,
  ) {
    const data = await this.suggestionsService.createSuggestion(user.id, dto);
    return { message: 'Suggestion submitted', data };
  }

  @Get('my')
  @Roles('user')
  @ApiOperation({ summary: '[User] Get my submitted suggestions' })
  @ApiResponse({ status: 200, description: 'Your suggestions' })
  async getMySuggestions(@CurrentUser() user: any) {
    const data = await this.suggestionsService.getMySuggestions(user.id);
    return { message: 'Your suggestions', data };
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: '[Admin] Get all suggestions' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'approved', 'rejected'] })
  @ApiResponse({ status: 200, description: 'All suggestions' })
  async getAllSuggestions(@Query('status') status?: string) {
    const data = await this.suggestionsService.getAllSuggestions(status);
    return { message: 'Suggestions retrieved', data };
  }

  @Patch(':id/approve')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Admin] Approve suggestion and auto-create store' })
  @ApiResponse({ status: 200, description: 'Suggestion approved, store created' })
  async approveSuggestion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('admin_note') adminNote?: string,
  ) {
    return this.suggestionsService.approveSuggestion(id, adminNote);
  }

  @Patch(':id/reject')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Admin] Reject a suggestion' })
  @ApiResponse({ status: 200, description: 'Suggestion rejected' })
  async rejectSuggestion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('admin_note') adminNote?: string,
  ) {
    const data = await this.suggestionsService.rejectSuggestion(id, adminNote);
    return { message: 'Suggestion rejected', data };
  }
}
