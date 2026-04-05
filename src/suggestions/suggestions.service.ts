import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';

@Injectable()
export class SuggestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async createSuggestion(userId: string, dto: CreateSuggestionDto) {
    const suggestion = await this.prisma.storeSuggestion.create({
      data: {
        suggested_by: userId,
        name: dto.name,
        description: dto.description,
        address: dto.address,
        latitude: dto.latitude,
        longitude: dto.longitude,
        status: 'pending',
      },
    });

    return suggestion;
  }

  async getMySuggestions(userId: string) {
    const suggestions = await this.prisma.storeSuggestion.findMany({
      where: { suggested_by: userId },
      orderBy: { created_at: 'desc' },
    });

    return suggestions;
  }

  async getAllSuggestions(status?: string) {
    const suggestions = await this.prisma.storeSuggestion.findMany({
      where: status ? { status } : {},
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    return suggestions;
  }

  async approveSuggestion(suggestionId: string, adminNote?: string) {
    const suggestion = await this.prisma.storeSuggestion.findUnique({
      where: { id: suggestionId },
    });

    if (!suggestion) throw new NotFoundException('Suggestion not found');

    // Update suggestion status
    await this.prisma.storeSuggestion.update({
      where: { id: suggestionId },
      data: {
        status: 'approved',
        admin_note: adminNote,
        updated_at: new Date(),
      },
    });

    // Auto-create a store from suggestion data (unclaimed)
    const store = await this.prisma.store.create({
      data: {
        owner_id: null,
        name: suggestion.name,
        description: suggestion.description,
        address: suggestion.address,
        latitude: suggestion.latitude ?? 0,
        longitude: suggestion.longitude ?? 0,
        status: 'active',
        is_claimed: false,
      },
    });

    return {
      message: 'Suggestion approved and store created',
      data: { suggestion: { ...suggestion, status: 'approved' }, store },
    };
  }

  async rejectSuggestion(suggestionId: string, adminNote?: string) {
    try {
      const suggestion = await this.prisma.storeSuggestion.update({
        where: { id: suggestionId },
        data: {
          status: 'rejected',
          admin_note: adminNote,
          updated_at: new Date(),
        },
      });

      return suggestion;
    } catch {
      throw new NotFoundException('Suggestion not found');
    }
  }
}
