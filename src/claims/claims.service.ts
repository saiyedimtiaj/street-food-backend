import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateClaimDto } from './dto/create-claim.dto';

@Injectable()
export class ClaimsService {
  constructor(private readonly prisma: PrismaService) {}

  async createClaim(userId: string, dto: CreateClaimDto) {
    // Verify the store is unclaimed
    const store = await this.prisma.store.findUnique({
      where: { id: dto.store_id },
      select: { id: true, owner_id: true, is_claimed: true },
    });

    if (!store) throw new NotFoundException('Store not found');

    if (store.is_claimed || store.owner_id !== null) {
      throw new ConflictException('This store has already been claimed');
    }

    if (store.owner_id === userId) {
      throw new ForbiddenException('You already own this store');
    }

    // Check for duplicate claim
    const existing = await this.prisma.storeClaim.findUnique({
      where: {
        store_id_claimed_by: { store_id: dto.store_id, claimed_by: userId },
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('You have already submitted a claim for this store');
    }

    const claim = await this.prisma.storeClaim.create({
      data: {
        store_id: dto.store_id,
        claimed_by: userId,
        message: dto.message,
        status: 'pending',
      },
    });

    return claim;
  }

  async getAllClaims(status?: string) {
    const claims = await this.prisma.storeClaim.findMany({
      where: status ? { status } : {},
      include: {
        store: { select: { id: true, name: true, address: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    return claims;
  }

  async approveClaim(claimId: string, adminNote?: string) {
    const claim = await this.prisma.storeClaim.findUnique({
      where: { id: claimId },
    });

    if (!claim) throw new NotFoundException('Claim not found');

    // Approve this claim
    await this.prisma.storeClaim.update({
      where: { id: claimId },
      data: {
        status: 'approved',
        admin_note: adminNote,
        updated_at: new Date(),
      },
    });

    // Link store to claimant
    const store = await this.prisma.store.update({
      where: { id: claim.store_id },
      data: {
        owner_id: claim.claimed_by,
        is_claimed: true,
        updated_at: new Date(),
      },
    });

    // Auto-reject other pending claims for the same store
    await this.prisma.storeClaim.updateMany({
      where: {
        store_id: claim.store_id,
        status: 'pending',
        NOT: { id: claimId },
      },
      data: { status: 'rejected', admin_note: 'Another claim was approved' },
    });

    return { message: 'Claim approved — store linked to owner', data: store };
  }

  async rejectClaim(claimId: string, adminNote?: string) {
    try {
      const claim = await this.prisma.storeClaim.update({
        where: { id: claimId },
        data: {
          status: 'rejected',
          admin_note: adminNote,
          updated_at: new Date(),
        },
      });

      return claim;
    } catch {
      throw new NotFoundException('Claim not found');
    }
  }
}
