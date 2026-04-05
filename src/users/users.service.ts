import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CloudinaryService } from '../uploads/cloudinary.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
    file?: Express.Multer.File,
  ) {
    const updateData: Record<string, any> = {
      updated_at: new Date(),
    };

    if (dto.name) updateData.name = dto.name;
    if (dto.bio !== undefined) updateData.bio = dto.bio;

    if (file) {
      const existing = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { profile_photo_public_id: true },
      });

      if (existing?.profile_photo_public_id) {
        await this.cloudinary.deleteImage(existing.profile_photo_public_id);
      }

      const uploaded = await this.cloudinary.uploadImage(
        file.buffer,
        file.originalname,
        'street-food/profiles',
      );

      updateData.profile_photo = uploaded.url;
      updateData.profile_photo_public_id = uploaded.public_id;
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profile_photo: true,
        bio: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
    });

    return user;
  }

  async getAllUsers(role?: string, page = 1, limit = 10) {
    const where = role ? { role } : {};

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          is_active: true,
          created_at: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profile_photo: true,
        bio: true,
        is_active: true,
        created_at: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }

  async deactivateUser(id: string) {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: { is_active: false, updated_at: new Date() },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          is_active: true,
        },
      });

      return user;
    } catch {
      throw new NotFoundException(`User with id ${id} not found`);
    }
  }
}
