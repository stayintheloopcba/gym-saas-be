import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { MembershipsModule } from '../modules/memberships/memberships.module';
import { AuthContextMiddleware } from './context/auth-context.middleware';
import { AuthContextService } from './context/auth-context.service';
import { HttpLoggingInterceptor } from './logging/http-logging.interceptor';
import { StructuredLogger } from './logging/structured-logger.service';

/**
 * Módulo común global.
 *
 * Expone el seam de contexto de autenticación (`AuthContextService`) a toda la
 * app sin necesidad de importarlo en cada módulo, y provee el
 * `AuthContextMiddleware` (que `AppModule` registra globalmente). Importa
 * `JwtModule` para que el middleware pueda verificar el access token y
 * `MembershipsModule` para inyectarle el `MEMBERSHIP_CONTEXT_PORT` con el que
 * valida la cookie de organización activa.
 */
@Global()
@Module({
  imports: [JwtModule.register({}), MembershipsModule],
  providers: [
    AuthContextService,
    AuthContextMiddleware,
    StructuredLogger,
    { provide: APP_INTERCEPTOR, useClass: HttpLoggingInterceptor },
  ],
  exports: [AuthContextService, StructuredLogger, JwtModule],
})
export class CommonModule {}
