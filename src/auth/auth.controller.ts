import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { jwtConfig } from '../config/jwt.config';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Register a new user (user or store role)' })
  @ApiResponse({ status: 201, description: 'Registration successful' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login and receive JWT cookie' })
  @ApiResponse({ status: 200, description: 'Login successful — sets httpOnly cookie' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto);

    res.cookie(jwtConfig.cookieName, result.accessToken, jwtConfig.cookieOptions);

    return {
      message: 'Login successful',
      data: { user: result.user },
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Logout — clears the auth cookie' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(jwtConfig.cookieName);
    return { message: 'Logged out successfully', data: null };
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiResponse({ status: 200, description: 'Current user data' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async getMe(@CurrentUser() user: any) {
    const data = await this.authService.getMe(user.id);
    return { message: 'Current user', data };
  }
}
