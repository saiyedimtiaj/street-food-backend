import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import type { NestExpressApplication } from '@nestjs/platform-express';

let cachedApp: NestExpressApplication;

async function bootstrap(): Promise<NestExpressApplication> {
  if (cachedApp) return cachedApp;

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ─── CORS ───────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // ─── Cookie Parser ───────────────────────────────────────────────────────────
  app.use(cookieParser());

  // ─── Global API Prefix ───────────────────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ─── Global Validation Pipe ──────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,             // Strip unknown properties
      forbidNonWhitelisted: false, // Don't error on extra props (multipart has extras)
      transform: true,             // Auto-transform types per DTO
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ─── Swagger Documentation ───────────────────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Street Food Review System API')
    .setDescription(
      `
## 🍜 Street Food Review System

A role-based platform for discovering, reviewing, and managing street food stores.

### Roles
- **user** — discover stores, write reviews, suggest new stores
- **store** — manage store profile, menu, reply to reviews, claim listings
- **admin** — moderate platform, approve suggestions/claims, view analytics

### Authentication
This API uses **JWT stored in an httpOnly cookie** (\`access_token\`).

To authenticate in Swagger:
1. Call \`POST /api/v1/auth/login\` to get your token in the cookie
2. Copy the \`access_token\` value from the cookie
3. Click **Authorize** and paste: \`Bearer <your_token>\`

The cookie is set automatically when using a browser frontend.
      `.trim(),
    )
    .setVersion('1.0')
    .addTag('Auth', 'Authentication — register, login, logout, me')
    .addTag('Users', 'User profile management and admin user control')
    .addTag('Stores', 'Store listing, search by location, manage store profile')
    .addTag('Foods', 'Food menu management per store')
    .addTag('Reviews', 'Customer reviews and store replies')
    .addTag('Suggestions', 'User-submitted store suggestions for admin review')
    .addTag('Claims', 'Store ownership claim workflow')
    .addTag('Admin', 'Platform admin dashboard and moderation')
    .addTag('Uploads', 'Utility image upload endpoint')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste your JWT access token here (for Swagger testing)',
      },
      'Bearer',
    )
    .addCookieAuth('access_token', {
      type: 'apiKey',
      in: 'cookie',
      name: 'access_token',
      description: 'httpOnly JWT cookie (set automatically on login)',
    })
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Street Food API Docs',
  });

  // ─── Start Server ─────────────────────────────────────────────────────────────
  const port = process.env.PORT || 5000;

  if (!process.env.VERCEL) {
    await app.listen(port);
    console.log(`\n🍜 Street Food Review System API is running`);
    console.log(`   → Server:  http://localhost:${port}`);
    console.log(`   → API:     http://localhost:${port}/api/v1`);
    console.log(`   → Swagger: http://localhost:${port}/api/docs\n`);
  } else {
    await app.init();
  }

  cachedApp = app;
  return app;
}

const appPromise = bootstrap();

// Vercel serverless handler
export default async function handler(req: any, res: any) {
  const app = await appPromise;
  const instance = app.getHttpAdapter().getInstance();
  instance(req, res);
}
