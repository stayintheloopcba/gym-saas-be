import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { FindUserByIdUseCase } from '../../users/application/find-user.use-cases';
import { toPublicProfile, UserPublicProfile } from '../../users/application/user-public-profile';
import { SessionService } from '../../sessions/application/session.service';
import { TokenPayload } from '../application/token-service.port';
import { ACCESS_TOKEN_COOKIE } from './auth-cookies';

export interface AuthenticatedPrincipal {
  user: UserPublicProfile;
  sessionId: string;
}

/** Extrae el access token desde la cookie httpOnly (no del header Authorization). */
const cookieExtractor = (req: Request): string | null => {
  const cookies = req.cookies as Record<string, string> | undefined;
  return cookies?.[ACCESS_TOKEN_COOKIE] ?? null;
};

/**
 * Estrategia JWT de Passport. Valida el access token de la cookie y resuelve el
 * usuario autenticado, que NestJS adjunta a `req.user`.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly findById: FindUserByIdUseCase,
    private readonly sessions: SessionService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: TokenPayload): Promise<AuthenticatedPrincipal> {
    if (!(await this.sessions.isActive(payload.sub, payload.sessionId))) {
      throw new UnauthorizedException('Session is no longer active');
    }
    const user = await this.findById.execute(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }
    return { user: toPublicProfile(user), sessionId: payload.sessionId };
  }
}
