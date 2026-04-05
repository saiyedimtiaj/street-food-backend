import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { jwtConfig } from '../config/jwt.config';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: jwtConfig.accessSecret(),
      signOptions: { expiresIn: jwtConfig.accessExpiresIn() as any },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
