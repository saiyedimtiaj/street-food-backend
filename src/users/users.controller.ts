import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiCookieAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

const profilePhotoInterceptor = FileInterceptor('profile_photo', {
  storage: memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(
        new BadRequestException('Only jpg, png, and webp images are allowed'),
        false,
      );
    }
    cb(null, true);
  },
});

@ApiTags('Users')
@ApiBearerAuth()
@ApiCookieAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(profilePhotoInterceptor)
  @ApiOperation({ summary: 'Update own profile (name, bio, profile photo)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        bio: { type: 'string' },
        profile_photo: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  async updateProfile(
    @CurrentUser() user: any,
    @Body() dto: UpdateProfileDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const data = await this.usersService.updateProfile(user.id, dto, file);
    return { message: 'Profile updated successfully', data };
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: '[Admin] Get all users with pagination' })
  @ApiQuery({ name: 'role', required: false, enum: ['user', 'store', 'admin'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of users' })
  async getAllUsers(
    @Query('role') role?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const data = await this.usersService.getAllUsers(
      role,
      parseInt(page),
      parseInt(limit),
    );
    return { message: 'Users retrieved', data };
  }

  @Get(':id')
  @Roles('admin')
  @ApiOperation({ summary: '[Admin] Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.usersService.getUserById(id);
    return { message: 'User retrieved', data };
  }

  @Patch(':id/deactivate')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Admin] Deactivate a user account' })
  @ApiResponse({ status: 200, description: 'User deactivated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deactivateUser(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.usersService.deactivateUser(id);
    return { message: 'User deactivated', data };
  }
}
