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
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
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
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { CreateReplyDto, UpdateReplyDto } from './dto/create-reply.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Transform } from 'class-transformer';

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

@ApiTags('Reviews')
@ApiBearerAuth()
@ApiCookieAuth()
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @Roles('user')
  @UseInterceptors(
    FilesInterceptor('images', 3, {
      storage: memoryStorage(),
      limits: { fileSize: 3 * 1024 * 1024 },
      fileFilter: imageFilter,
    }),
  )
  @ApiOperation({ summary: '[User] Submit a review for a store (max 1 per store)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Review submitted' })
  @ApiResponse({ status: 409, description: 'Already reviewed this store' })
  async createReview(
    @CurrentUser() user: any,
    @Body() dto: CreateReviewDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    const data = await this.reviewsService.createReview(user.id, dto, files);
    return { message: 'Review submitted', data };
  }

  // Static route before param routes
  @Get('store/:storeId')
  @Public()
  @ApiOperation({ summary: 'Get all reviews for a store (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Reviews list' })
  async getReviewsByStore(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const data = await this.reviewsService.getReviewsByStore(
      storeId,
      parseInt(page),
      parseInt(limit),
    );
    return { message: 'Reviews retrieved', data };
  }

  @Patch(':id')
  @Roles('user')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FilesInterceptor('images_add', 3, {
      storage: memoryStorage(),
      limits: { fileSize: 3 * 1024 * 1024 },
      fileFilter: imageFilter,
    }),
  )
  @ApiOperation({ summary: '[User] Update own review' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Review updated' })
  async updateReview(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Body() body: any,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    const data = await this.reviewsService.updateReview(id, user.id, body, files);
    return { message: 'Review updated', data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[User/Admin] Delete a review' })
  @ApiResponse({ status: 200, description: 'Review deleted' })
  async deleteReview(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    const data = await this.reviewsService.deleteReview(id, user.id, user.role);
    return { message: 'Review deleted', data };
  }

  @Post(':reviewId/reply')
  @Roles('store')
  @ApiOperation({ summary: '[Store] Reply to a review on your store' })
  @ApiResponse({ status: 201, description: 'Reply submitted' })
  @ApiResponse({ status: 409, description: 'Already replied to this review' })
  async replyToReview(
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateReplyDto,
  ) {
    const data = await this.reviewsService.replyToReview(reviewId, user.id, dto);
    return { message: 'Reply submitted', data };
  }

  @Patch(':reviewId/reply')
  @Roles('store')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Store] Update your reply to a review' })
  @ApiResponse({ status: 200, description: 'Reply updated' })
  async updateReply(
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateReplyDto,
  ) {
    const data = await this.reviewsService.updateReply(reviewId, user.id, dto);
    return { message: 'Reply updated', data };
  }
}
