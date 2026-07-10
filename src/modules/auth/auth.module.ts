import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { GymsModule } from '../gyms/gyms.module';
import { SessionsModule } from '../sessions/sessions.module';
import { SessionService } from '../sessions/application/session.service';
import { UsersModule } from '../users/users.module';
import { GoogleAuthUseCase } from './application/google-auth.use-case';
import { LoginUseCase } from './application/login.use-case';
import { LogoutUseCase } from './application/logout.use-case';
import { PASSWORD_HASHER } from './application/password-hasher.port';
import { RefreshTokenUseCase } from './application/refresh-token.use-case';
import { RegisterUseCase } from './application/register.use-case';
import { TOKEN_SERVICE } from './application/token-service.port';
import { BcryptPasswordHasher } from './infrastructure/bcrypt-password-hasher';
import { JwtTokenService } from './infrastructure/jwt-token.service';
import { AuthController } from './interfaces/auth.controller';
import { AuthCookies } from './interfaces/auth-cookies';
import { DomainExceptionFilter } from './interfaces/domain-exception.filter';
import { GoogleStrategy } from './interfaces/google.strategy';
import { JwtStrategy } from './interfaces/jwt.strategy';
import { SessionsController } from './interfaces/sessions.controller';

/**
 * Módulo de autenticación (capas DDD: application / infrastructure / interfaces).
 *
 * Vincula los ports (`PASSWORD_HASHER`, `TOKEN_SERVICE`) a sus adapters,
 * registra las estrategias Passport y depende de `UsersModule` para los use
 * cases de usuarios — nunca de TypeORM directamente.
 *
 * `DomainExceptionFilter` se registra con `APP_FILTER` para que sea global:
 * cualquier módulo futuro que lance `DuplicateEmailError` o `UserNotFoundError`
 * recibirá la traducción HTTP correcta sin tener que declarar `@UseFilters`.
 */
@Module({
  imports: [UsersModule, SessionsModule, GymsModule, PassportModule, JwtModule.register({})],
  controllers: [AuthController, SessionsController],
  providers: [
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
    SessionService,
    RegisterUseCase,
    LoginUseCase,
    LogoutUseCase,
    RefreshTokenUseCase,
    GoogleAuthUseCase,
    AuthCookies,
    JwtStrategy,
    GoogleStrategy,
  ],
})
export class AuthModule {}
