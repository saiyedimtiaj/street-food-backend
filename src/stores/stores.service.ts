import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CloudinaryService } from '../uploads/cloudinary.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@Injectable()
export class StoresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async createStore(
    ownerId: string,
    dto: CreateStoreDto,
    coverFile?: Express.Multer.File,
    galleryFiles?: Express.Multer.File[],
  ) {
    // Store-role users can only own one store
    const existing = await this.prisma.store.findFirst({
      where: { owner_id: ownerId },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('You already have a store registered');
    }

    let coverImage: string | null = null;
    let coverImagePublicId: string | null = null;

    if (coverFile) {
      const uploaded = await this.cloudinary.uploadImage(
        coverFile.buffer,
        coverFile.originalname,
        'street-food/stores/covers',
      );
      coverImage = uploaded.url;
      coverImagePublicId = uploaded.public_id;
    }

    const store = await this.prisma.store.create({
      data: {
        owner_id: ownerId,
        name: dto.name,
        description: dto.description,
        category: dto.category,
        address: dto.address,
        latitude: dto.latitude,
        longitude: dto.longitude,
        cover_image: coverImage,
        cover_image_public_id: coverImagePublicId,
        is_claimed: true,
        status: 'active',
      },
    });

    let gallery: any[] = [];

    if (galleryFiles && galleryFiles.length > 0) {
      const uploaded = await this.cloudinary.uploadMany(
        galleryFiles,
        'street-food/stores/gallery',
      );

      const galleryRows = uploaded.map((u) => ({
        store_id: store.id,
        image_url: u.url,
        public_id: u.public_id,
      }));

      await this.prisma.storeGallery.createMany({ data: galleryRows });

      gallery = await this.prisma.storeGallery.findMany({
        where: { store_id: store.id },
      });
    }

    return { ...store, gallery };
  }

  async updateStore(
    storeId: string,
    ownerId: string,
    dto: UpdateStoreDto,
    coverFile?: Express.Multer.File,
    galleryFiles?: Express.Multer.File[],
  ) {
    const store = await this.getStoreOrThrow(storeId);

    if (store.owner_id !== ownerId) {
      throw new ForbiddenException('You do not own this store');
    }

    const updateData: Record<string, any> = {
      updated_at: new Date(),
    };

    if (dto.name) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.category !== undefined) updateData.category = dto.category;
    if (dto.address !== undefined) updateData.address = dto.address;
    if (dto.latitude !== undefined) updateData.latitude = dto.latitude;
    if (dto.longitude !== undefined) updateData.longitude = dto.longitude;

    if (coverFile) {
      if (store.cover_image_public_id) {
        await this.cloudinary.deleteImage(store.cover_image_public_id);
      }
      const uploaded = await this.cloudinary.uploadImage(
        coverFile.buffer,
        coverFile.originalname,
        'street-food/stores/covers',
      );
      updateData.cover_image = uploaded.url;
      updateData.cover_image_public_id = uploaded.public_id;
    }

    // Handle gallery removals
    if (dto.gallery_remove) {
      let publicIds: string[] = [];
      try {
        publicIds = JSON.parse(dto.gallery_remove);
      } catch {
        throw new BadRequestException('gallery_remove must be a valid JSON array');
      }

      await Promise.all(publicIds.map((pid) => this.cloudinary.deleteImage(pid)));
      await this.prisma.storeGallery.deleteMany({
        where: { public_id: { in: publicIds } },
      });
    }

    // Handle gallery additions
    if (galleryFiles && galleryFiles.length > 0) {
      const count = await this.prisma.storeGallery.count({
        where: { store_id: storeId },
      });

      if (count + galleryFiles.length > 6) {
        throw new BadRequestException(
          'Total gallery images cannot exceed 6',
        );
      }

      const uploaded = await this.cloudinary.uploadMany(
        galleryFiles,
        'street-food/stores/gallery',
      );

      const galleryRows = uploaded.map((u) => ({
        store_id: storeId,
        image_url: u.url,
        public_id: u.public_id,
      }));

      await this.prisma.storeGallery.createMany({ data: galleryRows });
    }

    const updatedStore = await this.prisma.store.update({
      where: { id: storeId },
      data: updateData,
    });

    const gallery = await this.prisma.storeGallery.findMany({
      where: { store_id: storeId },
    });

    return { ...updatedStore, gallery };
  }

  async getStoreById(storeId: string) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundException(`Store with id ${storeId} not found`);
    }

    const [gallery, foods, reviews] = await Promise.all([
      this.prisma.storeGallery.findMany({
        where: { store_id: storeId },
        select: { id: true, image_url: true, public_id: true, created_at: true },
      }),
      this.prisma.food.findMany({
        where: { store_id: storeId },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.review.findMany({
        where: { store_id: storeId },
        include: {
          user: { select: { id: true, name: true, profile_photo: true } },
          images: { select: { id: true, image_url: true, public_id: true } },
          replies: { select: { id: true, reply_text: true, created_at: true, updated_at: true } },
        },
        orderBy: { created_at: 'desc' },
      }),
    ]);

    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    return {
      ...store,
      gallery,
      foods,
      reviews,
      averageRating: Math.round(avgRating * 10) / 10,
      totalReviews: reviews.length,
    };
  }

  async searchByLocation(lat: number, lng: number, radiusKm = 5) {
    const stores = await this.prisma.store.findMany({
      where: { status: 'active' },
    });

    const storesWithDistance = stores
      .map((store) => {
        const distance = this.haversineDistance(
          lat,
          lng,
          Number(store.latitude),
          Number(store.longitude),
        );
        return { ...store, distance_km: Math.round(distance * 100) / 100 };
      })
      .filter((s) => s.distance_km <= radiusKm)
      .sort((a, b) => a.distance_km - b.distance_km);

    return storesWithDistance;
  }

  private haversineDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  async getMyStore(ownerId: string) {
    const store = await this.prisma.store.findFirst({
      where: { owner_id: ownerId },
    });

    if (!store) {
      throw new NotFoundException('You do not have a store yet');
    }

    const gallery = await this.prisma.storeGallery.findMany({
      where: { store_id: store.id },
    });

    return { ...store, gallery };
  }

  async getAllStores(status?: string, page = 1, limit = 10) {
    const where = status ? { status } : {};

    const [stores, total] = await this.prisma.$transaction([
      this.prisma.store.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.store.count({ where }),
    ]);

    return {
      stores,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async deleteStore(storeId: string) {
    const store = await this.getStoreOrThrow(storeId);

    // Delete cover image from Cloudinary
    if (store.cover_image_public_id) {
      await this.cloudinary.deleteImage(store.cover_image_public_id);
    }

    // Delete gallery images from Cloudinary
    const gallery = await this.prisma.storeGallery.findMany({
      where: { store_id: storeId },
      select: { public_id: true },
    });

    if (gallery.length > 0) {
      await Promise.all(gallery.map((g) => this.cloudinary.deleteImage(g.public_id)));
    }

    await this.prisma.store.delete({ where: { id: storeId } });

    return { message: 'Store deleted successfully' };
  }

  private async getStoreOrThrow(storeId: string) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundException(`Store with id ${storeId} not found`);
    }
    return store;
  }
}
