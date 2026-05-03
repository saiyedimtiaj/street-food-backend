import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';

@Injectable()
export class ComplaintsService {
  constructor(private readonly prisma: PrismaService) {}

  async createComplaint(userId: string, dto: CreateComplaintDto) {
    const store = await this.prisma.store.findUnique({
      where: { id: dto.store_id },
      select: { id: true },
    });
    if (!store) throw new NotFoundException('Store not found');

    const existing = await this.prisma.storeComplaint.findUnique({
      where: { user_id_store_id: { user_id: userId, store_id: dto.store_id } },
    });
    if (existing) throw new ConflictException('You have already submitted a complaint for this store');

    return this.prisma.storeComplaint.create({
      data: {
        store_id: dto.store_id,
        user_id: userId,
        subject: dto.subject,
        description: dto.description,
        status: 'pending',
      },
      include: {
        store: { select: { id: true, name: true } },
      },
    });
  }

  async getMyComplaint(userId: string, storeId: string) {
    return this.prisma.storeComplaint.findUnique({
      where: { user_id_store_id: { user_id: userId, store_id: storeId } },
    });
  }

  async getMyComplaints(userId: string) {
    return this.prisma.storeComplaint.findMany({
      where: { user_id: userId },
      include: { store: { select: { id: true, name: true, address: true } } },
      orderBy: { created_at: 'desc' },
    });
  }

  async getComplaintsByStore(storeId: string, requesterId: string) {
    // Verify requester owns the store
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { owner_id: true },
    });
    if (!store) throw new NotFoundException('Store not found');
    if (store.owner_id !== requesterId) throw new ForbiddenException('Access denied');

    return this.prisma.storeComplaint.findMany({
      where: { store_id: storeId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { created_at: 'desc' },
    });
  }

  async getAllComplaints(status?: string) {
    return this.prisma.storeComplaint.findMany({
      where: status ? { status } : {},
      include: {
        store: { select: { id: true, name: true, address: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async resolveComplaint(id: string, adminNote?: string) {
    try {
      return this.prisma.storeComplaint.update({
        where: { id },
        data: { status: 'resolved', admin_note: adminNote, updated_at: new Date() },
      });
    } catch {
      throw new NotFoundException('Complaint not found');
    }
  }

  async dismissComplaint(id: string, adminNote?: string) {
    try {
      return this.prisma.storeComplaint.update({
        where: { id },
        data: { status: 'dismissed', admin_note: adminNote, updated_at: new Date() },
      });
    } catch {
      throw new NotFoundException('Complaint not found');
    }
  }
}
