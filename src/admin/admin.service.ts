import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const [totalUsers, totalStores, totalReviews, pendingSuggestions, pendingClaims, pendingComplaints, activeStores] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.store.count(),
        this.prisma.review.count(),
        this.prisma.storeSuggestion.count({ where: { status: 'pending' } }),
        this.prisma.storeClaim.count({ where: { status: 'pending' } }),
        this.prisma.storeComplaint.count({ where: { status: 'pending' } }),
        this.prisma.store.count({ where: { status: 'active' } }),
      ]);

    return {
      totalUsers,
      totalStores,
      totalReviews,
      pendingSuggestions,
      pendingClaims,
      pendingComplaints,
      activeStores,
    };
  }

  async suspendStore(storeId: string) {
    try {
      const store = await this.prisma.store.update({
        where: { id: storeId },
        data: { status: 'suspended', updated_at: new Date() },
        select: { id: true, name: true, status: true },
      });

      return store;
    } catch {
      throw new NotFoundException('Store not found');
    }
  }

  async activateStore(storeId: string) {
    try {
      const store = await this.prisma.store.update({
        where: { id: storeId },
        data: { status: 'active', updated_at: new Date() },
        select: { id: true, name: true, status: true },
      });

      return store;
    } catch {
      throw new NotFoundException('Store not found');
    }
  }
}
