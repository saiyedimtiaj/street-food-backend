import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

// Database
import { DatabaseModule } from './database/database.module';

// Common
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

// Feature Modules
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StoresModule } from './stores/stores.module';
import { FoodsModule } from './foods/foods.module';
import { ReviewsModule } from './reviews/reviews.module';
import { SuggestionsModule } from './suggestions/suggestions.module';
import { ClaimsModule } from './claims/claims.module';
import { AdminModule } from './admin/admin.module';
import { UploadsModule } from './uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    UploadsModule,
    AuthModule,
    UsersModule,
    StoresModule,
    FoodsModule,
    ReviewsModule,
    SuggestionsModule,
    ClaimsModule,
    AdminModule,
  ],
  providers: [
    // Global Guards — order matters: Auth runs first, then Roles
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    // Global Exception Filter
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    // Global Response Interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule {}
