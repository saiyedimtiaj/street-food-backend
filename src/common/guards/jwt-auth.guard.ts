import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PrismaService } from '../../database/prisma.service';
import { jwtConfig } from '../../config/jwt.config';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('No authentication token provided');
    }

    let payload: { sub: string; email: string; role: string };

    try {
      payload = this.jwtService.verify(token, {
        secret: jwtConfig.accessSecret(),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        is_active: true,
        profile_photo: true,
        bio: true,
        created_at: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Your account has been deactivated');
    }

    request.user = user;
    return true;
  }

  private extractToken(request: any): string | null {
    // 1. Try httpOnly cookie first
    const cookieToken = request.cookies?.[jwtConfig.cookieName];
    if (cookieToken) return cookieToken;

    // 2. Fall back to Authorization header (for Swagger UI / API clients)
    const authHeader = request.headers?.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    return null;
  }
}
