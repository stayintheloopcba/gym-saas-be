import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CookieOptions, Response } from 'express';
import { TokenPair } from '../application/token-service.port';

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';

/** La cookie refresh solo viaja a rutas auth (refresh y logout). */
const REFRESH_COOKIE_PATH = '/auth';
const LEGACY_REFRESH_COOKIE_PATH = '/auth/refresh';

/**
 * Helper que centraliza el manejo de las cookies httpOnly de sesión.
 *
 * Los tokens nunca se devuelven en el body: solo viajan en estas cookies con
 * flags `httpOnly` + `sameSite=lax` + `secure` (según `COOKIE_SECURE`).
 */
@Injectable()
export class AuthCookies {
  private readonly secure: boolean;
  private readonly domain: string;

  constructor(config: ConfigService) {
    this.secure = config.get<string>('COOKIE_SECURE') === 'true';
    this.domain = config.get<string>('COOKIE_DOMAIN', 'localhost');
  }

  setSessionCookies(res: Response, tokens: TokenPair): void {
    res.cookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, this.baseOptions());
    res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
      ...this.baseOptions(),
      path: REFRESH_COOKIE_PATH,
    });
  }

  clearSessionCookies(res: Response): void {
    res.clearCookie(ACCESS_TOKEN_COOKIE, this.baseOptions());
    res.clearCookie(REFRESH_TOKEN_COOKIE, { ...this.baseOptions(), path: REFRESH_COOKIE_PATH });
    res.clearCookie(REFRESH_TOKEN_COOKIE, { ...this.baseOptions(), path: LEGACY_REFRESH_COOKIE_PATH });
  }

  private baseOptions(): CookieOptions {
    return {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.secure,
      domain: this.domain,
      path: '/',
    };
  }
}
