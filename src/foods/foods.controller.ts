import {
  Body,
  Controller,
  Delete,
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
import { FoodsService } from './foods.service';
import { CreateFoodDto } from './dto/create-food.dto';
import { UpdateFoodDto } from './dto/update-food.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Foods')
@ApiBearerAuth()
@ApiCookieAuth()
@Controller('foods')
export class FoodsController {
  constructor(private readonly foodsService: FoodsService) {}

  @Post()
  @Roles('store')
  @ApiOperation({ summary: '[Store] Add a food item to your store' })
  @ApiResponse({ status: 201, description: 'Food item created' })
  async createFood(@CurrentUser() user: any, @Body() dto: CreateFoodDto) {
    const data = await this.foodsService.createFood(user.id, dto);
    return { message: 'Food item created', data };
  }

  // Static route before param route
  @Get('store/:storeId')
  @Public()
  @ApiOperation({ summary: 'Get all foods for a store (public)' })
  @ApiQuery({ name: 'available', required: false, enum: ['true', 'false'] })
  @ApiResponse({ status: 200, description: 'Foods list' })
  async getFoodsByStore(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Query('available') available?: string,
  ) {
    const data = await this.foodsService.getFoodsByStore(storeId, available);
    return { message: 'Foods retrieved', data };
  }

  @Patch(':id')
  @Roles('store')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Store] Update a food item' })
  @ApiResponse({ status: 200, description: 'Food item updated' })
  async updateFood(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateFoodDto,
  ) {
    const data = await this.foodsService.updateFood(id, user.id, dto);
    return { message: 'Food item updated', data };
  }

  @Delete(':id')
  @Roles('store')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Store] Delete a food item' })
  @ApiResponse({ status: 200, description: 'Food item deleted' })
  async deleteFood(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    const data = await this.foodsService.deleteFood(id, user.id);
    return { message: 'Food item deleted', data };
  }
}
