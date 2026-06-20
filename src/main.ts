import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { StructuredLogger } from './common/logging/structured-logger.service';
import { resolveCorsOrigins } from './config/cors.config';
import { setupOpenApi } from './config/openapi.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Parsea cookies en cada request: los tokens viajan en cookies httpOnly
  // (access_token / refresh_token), no en el header Authorization.
  app.use(cookieParser());

  // Validación global: rechaza propiedades no declaradas en los DTOs y
  // transforma el payload a la instancia tipada del DTO.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Manejo de errores uniforme para toda la API.
  app.useGlobalFilters(new AllExceptionsFilter(app.get(StructuredLogger)));

  const config = app.get(ConfigService);

  // CORS para el frontend (cookies httpOnly -> credentials: true).
  app.enableCors({
    origin: resolveCorsOrigins(config.get<string>('CORS_ORIGINS'), config.get<string>('FRONTEND_URL')),
    credentials: true,
  });

  setupOpenApi(app);

  await app.listen(config.get<number>('PORT', 3000));
}
void bootstrap();
