import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateFoodDto } from './dto/create-food.dto';
import { UpdateFoodDto } from './dto/update-food.dto';

@Injectable()
export class FoodsService {
  constructor(private readonly prisma: PrismaService) {}

  async createFood(ownerId: string, dto: CreateFoodDto) {
    await this.verifyStoreOwner(dto.store_id, ownerId);

    const food = await this.prisma.food.create({
      data: {
        store_id: dto.store_id,
        name: dto.name,
        description: dto.description,
        price: dto.price,
        image_url: dto.image_url,
        is_available: dto.is_available ?? true,
      },
    });

    return food;
  }

  async updateFood(foodId: string, ownerId: string, dto: UpdateFoodDto) {
    const food = await this.getFoodOrThrow(foodId);

    await this.verifyStoreOwner(food.store_id, ownerId);

    const updateData: Record<string, any> = {
      updated_at: new Date(),
    };

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.price !== undefined) updateData.price = dto.price;
    if (dto.image_url !== undefined) updateData.image_url = dto.image_url;
    if (dto.is_available !== undefined) updateData.is_available = dto.is_available;

    const updated = await this.prisma.food.update({
      where: { id: foodId },
      data: updateData,
    });

    return updated;
  }

  async deleteFood(foodId: string, ownerId: string) {
    const food = await this.getFoodOrThrow(foodId);

    await this.verifyStoreOwner(food.store_id, ownerId);

    await this.prisma.food.delete({ where: { id: foodId } });

    return { message: 'Food item deleted' };
  }

  async getFoodsByStore(storeId: string, available?: string) {
    const where: any = { store_id: storeId };

    if (available === 'true') {
      where.is_available = true;
    }

    const foods = await this.prisma.food.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });

    return foods;
  }

  private async getFoodOrThrow(foodId: string) {
    const food = await this.prisma.food.findUnique({
      where: { id: foodId },
    });

    if (!food) {
      throw new NotFoundException(`Food item with id ${foodId} not found`);
    }
    return food;
  }

  private async verifyStoreOwner(storeId: string, ownerId: string) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { owner_id: true },
    });

    if (!store) {
      throw new NotFoundException(`Store with id ${storeId} not found`);
    }

    if (store.owner_id !== ownerId) {
      throw new ForbiddenException('You do not own this store');
    }
  }
}
