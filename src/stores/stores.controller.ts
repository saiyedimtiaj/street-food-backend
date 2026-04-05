import {
  BadRequestException,
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
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiCookieAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

const imageFilter = (_req: any, file: Express.Multer.File, cb: any) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.mimetype)) {
    return cb(
      new BadRequestException('Only jpg, png, and webp images are allowed'),
      false,
    );
  }
  cb(null, true);
};

@ApiTags('Stores')
@ApiBearerAuth()
@ApiCookieAuth()
@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  @Roles('store')
  @UseInterceptors(
    FileInterceptor('cover_image', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: imageFilter,
    }),
  )
  @ApiOperation({ summary: '[Store] Create a new store (one store per owner)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Store created' })
  async createStore(
    @CurrentUser() user: any,
    @Body() dto: CreateStoreDto,
    @UploadedFile() coverFile?: Express.Multer.File,
  ) {
    const data = await this.storesService.createStore(user.id, dto, coverFile);
    return { message: 'Store created successfully', data };
  }

  @Post(':id/gallery')
  @Roles('store')
  @UseInterceptors(
    FilesInterceptor('gallery', 6, {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: imageFilter,
    }),
  )
  @ApiOperation({ summary: '[Store] Upload gallery images to store' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Gallery images uploaded' })
  async uploadGallery(
    @Param('id', ParseUUIDPipe) storeId: string,
    @CurrentUser() user: any,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const data = await this.storesService.updateStore(storeId, user.id, {}, undefined, files);
    return { message: 'Gallery updated', data };
  }

  // Static routes MUST come before :id to avoid conflicts
  @Get('search')
  @Public()
  @ApiOperation({ summary: 'Search stores by location (Haversine radius)' })
  @ApiQuery({ name: 'lat', required: true, type: Number })
  @ApiQuery({ name: 'lng', required: true, type: Number })
  @ApiQuery({ name: 'radius', required: false, type: Number, description: 'Radius in km (default 5)' })
  @ApiResponse({ status: 200, description: 'Stores within radius' })
  async searchByLocation(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius = '5',
  ) {
    if (!lat || !lng) {
      throw new BadRequestException('lat and lng query params are required');
    }
    const data = await this.storesService.searchByLocation(
      parseFloat(lat),
      parseFloat(lng),
      parseFloat(radius),
    );
    return { message: 'Stores found', data };
  }

  @Get('my-store')
  @Roles('store')
  @ApiOperation({ summary: '[Store] Get own store' })
  @ApiResponse({ status: 200, description: 'Your store' })
  async getMyStore(@CurrentUser() user: any) {
    const data = await this.storesService.getMyStore(user.id);
    return { message: 'Your store', data };
  }

  @Get('all')
  @Roles('admin')
  @ApiOperation({ summary: '[Admin] Get all stores with pagination' })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'inactive', 'suspended'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'All stores' })
  async getAllStores(
    @Query('status') status?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const data = await this.storesService.getAllStores(
      status,
      parseInt(page),
      parseInt(limit),
    );
    return { message: 'Stores retrieved', data };
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get store public profile (map, menu, reviews)' })
  @ApiResponse({ status: 200, description: 'Store details' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async getStoreById(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.storesService.getStoreById(id);
    return { message: 'Store retrieved', data };
  }

  @Patch(':id')
  @Roles('store')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('cover_image', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: imageFilter,
    }),
  )
  @ApiOperation({ summary: '[Store] Update store info and cover image' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Store updated' })
  async updateStore(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateStoreDto,
    @UploadedFile() coverFile?: Express.Multer.File,
  ) {
    const data = await this.storesService.updateStore(id, user.id, dto, coverFile);
    return { message: 'Store updated', data };
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Admin] Delete a store' })
  @ApiResponse({ status: 200, description: 'Store deleted' })
  async deleteStore(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.storesService.deleteStore(id);
    return { message: 'Store deleted', data };
  }
}
