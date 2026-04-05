import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CloudinaryService } from '../uploads/cloudinary.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { CreateReplyDto, UpdateReplyDto } from './dto/create-reply.dto';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async createReview(
    userId: string,
    dto: CreateReviewDto,
    imageFiles?: Express.Multer.File[],
  ) {
    // Check duplicate
    const existing = await this.prisma.review.findUnique({
      where: {
        user_id_store_id: { user_id: userId, store_id: dto.store_id },
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('You have already reviewed this store');
    }

    const review = await this.prisma.review.create({
      data: {
        user_id: userId,
        store_id: dto.store_id,
        rating: dto.rating,
        comment: dto.comment,
      },
    });

    let images: any[] = [];

    if (imageFiles && imageFiles.length > 0) {
      const uploaded = await this.cloudinary.uploadMany(
        imageFiles,
        'street-food/reviews',
      );

      const imageRows = uploaded.map((u) => ({
        review_id: review.id,
        image_url: u.url,
        public_id: u.public_id,
      }));

      await this.prisma.reviewImage.createMany({ data: imageRows });

      images = await this.prisma.reviewImage.findMany({
        where: { review_id: review.id },
      });
    }

    return { ...review, images };
  }

  async updateReview(
    reviewId: string,
    userId: string,
    dto: { rating?: number; comment?: string; images_remove?: string },
    imageFiles?: Express.Multer.File[],
  ) {
    const review = await this.getReviewOrThrow(reviewId);

    if (review.user_id !== userId) {
      throw new ForbiddenException('You did not write this review');
    }

    const updateData: Record<string, any> = {
      updated_at: new Date(),
    };
    if (dto.rating !== undefined) updateData.rating = dto.rating;
    if (dto.comment !== undefined) updateData.comment = dto.comment;

    // Handle image removals
    if (dto.images_remove) {
      let publicIds: string[] = [];
      try {
        publicIds = JSON.parse(dto.images_remove);
      } catch {
        throw new BadRequestException('images_remove must be a valid JSON array');
      }
      await Promise.all(publicIds.map((pid) => this.cloudinary.deleteImage(pid)));
      await this.prisma.reviewImage.deleteMany({
        where: {
          public_id: { in: publicIds },
          review_id: reviewId,
        },
      });
    }

    // Handle new image additions
    if (imageFiles && imageFiles.length > 0) {
      const count = await this.prisma.reviewImage.count({
        where: { review_id: reviewId },
      });

      if (count + imageFiles.length > 3) {
        throw new BadRequestException('Total review images cannot exceed 3');
      }

      const uploaded = await this.cloudinary.uploadMany(imageFiles, 'street-food/reviews');
      const imageRows = uploaded.map((u) => ({
        review_id: reviewId,
        image_url: u.url,
        public_id: u.public_id,
      }));
      await this.prisma.reviewImage.createMany({ data: imageRows });
    }

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: updateData,
    });

    const images = await this.prisma.reviewImage.findMany({
      where: { review_id: reviewId },
    });

    return { ...updated, images };
  }

  async deleteReview(reviewId: string, userId: string, userRole: string) {
    const review = await this.getReviewOrThrow(reviewId);

    if (userRole !== 'admin' && review.user_id !== userId) {
      throw new ForbiddenException('You cannot delete this review');
    }

    // Delete Cloudinary images
    const images = await this.prisma.reviewImage.findMany({
      where: { review_id: reviewId },
      select: { public_id: true },
    });

    if (images.length > 0) {
      await Promise.all(images.map((img) => this.cloudinary.deleteImage(img.public_id)));
    }

    await this.prisma.review.delete({ where: { id: reviewId } });

    return { message: 'Review deleted' };
  }

  async getReviewsByStore(storeId: string, page = 1, limit = 10) {
    const where = { store_id: storeId };

    const [reviews, total] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, profile_photo: true } },
          images: { select: { id: true, image_url: true, public_id: true } },
          replies: { select: { id: true, reply_text: true, created_at: true, updated_at: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      reviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async replyToReview(
    reviewId: string,
    storeOwnerId: string,
    dto: CreateReplyDto,
  ) {
    // Get the review and verify it belongs to the store owner's store
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      select: { store_id: true },
    });

    if (!review) throw new NotFoundException('Review not found');

    // Verify the store belongs to this owner
    const store = await this.prisma.store.findUnique({
      where: { id: review.store_id },
      select: { owner_id: true },
    });

    if (!store || store.owner_id !== storeOwnerId) {
      throw new ForbiddenException('You do not own the store this review belongs to');
    }

    // One reply per review
    const existingReply = await this.prisma.reviewReply.findFirst({
      where: { review_id: reviewId },
      select: { id: true },
    });

    if (existingReply) {
      throw new ConflictException('You have already replied to this review');
    }

    const reply = await this.prisma.reviewReply.create({
      data: {
        review_id: reviewId,
        store_id: review.store_id,
        reply_text: dto.reply_text,
      },
    });

    return reply;
  }

  async updateReply(reviewId: string, storeOwnerId: string, dto: UpdateReplyDto) {
    const reply = await this.prisma.reviewReply.findFirst({
      where: { review_id: reviewId },
      select: { id: true, store_id: true },
    });

    if (!reply) throw new NotFoundException('Reply not found');

    const store = await this.prisma.store.findUnique({
      where: { id: reply.store_id },
      select: { owner_id: true },
    });

    if (!store || store.owner_id !== storeOwnerId) {
      throw new ForbiddenException('You cannot edit this reply');
    }

    const updated = await this.prisma.reviewReply.update({
      where: { id: reply.id },
      data: {
        reply_text: dto.reply_text,
        updated_at: new Date(),
      },
    });

    return updated;
  }

  private async getReviewOrThrow(reviewId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException(`Review with id ${reviewId} not found`);
    }
    return review;
  }
}
