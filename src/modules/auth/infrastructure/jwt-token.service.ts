import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { TokenPair, TokenPayload, TokenService } from '../application/token-service.port';

type ExpiresIn = JwtSignOptions['expiresIn'];

/**
 * Implementación de `TokenService` con `@nestjs/jwt`.
 *
 * Usa secretos y expiraciones distintos para access y refresh (variables de
 * entorno `JWT_ACCESS_*` / `JWT_REFRESH_*`).
 */
@Injectable()
export class JwtTokenService implements TokenService {
  private readonly accessSecret: string;
  private readonly accessExpiresIn: ExpiresIn;
  private readonly refreshSecret: string;
  private readonly refreshExpiresIn: ExpiresIn;

  constructor(
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    this.accessSecret = config.getOrThrow<string>('JWT_ACCESS_SECRET');
    this.accessExpiresIn = config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m') as ExpiresIn;
    this.refreshSecret = config.getOrThrow<string>('JWT_REFRESH_SECRET');
    this.refreshExpiresIn = config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d') as ExpiresIn;
  }

  async issueTokens(payload: TokenPayload): Promise<TokenPair> {
    const claims: TokenPayload = { sub: payload.sub, email: payload.email, sessionId: payload.sessionId };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(claims, { secret: this.accessSecret, expiresIn: this.accessExpiresIn }),
      this.jwt.signAsync(claims, { secret: this.refreshSecret, expiresIn: this.refreshExpiresIn }),
    ]);
    return { accessToken, refreshToken };
  }

  verifyAccess(token: string): Promise<TokenPayload> {
    return this.verify(token, this.accessSecret);
  }

  verifyRefresh(token: string): Promise<TokenPayload> {
    return this.verify(token, this.refreshSecret);
  }

  private async verify(token: string, secret: string): Promise<TokenPayload> {
    try {
      return await this.jwt.verifyAsync<TokenPayload>(token, { secret });
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
