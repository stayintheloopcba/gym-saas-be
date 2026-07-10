import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CookieOptions, Response } from 'express';
import { ACTIVE_GYM_COOKIE } from '../../../common/context/membership-context.port';

/**
 * Helper de la cookie httpOnly que transporta la organización activa.
 *
 * A diferencia de la cookie de refresh (scoped a `/auth/refresh`), `active_gym`
 * se scopea a `/` porque debe viajar a todas las rutas de negocio. Mismos flags
 * de seguridad que las cookies de sesión (`httpOnly`, `sameSite=lax`, `secure`
 * según `COOKIE_SECURE`, `domain` según `COOKIE_DOMAIN`).
 */
@Injectable()
export class ActiveGymCookie {
  private readonly cookieName: string;
  private readonly secure: boolean;
  private readonly domain: string;

  constructor(config: ConfigService) {
    this.cookieName = config.get<string>('ACTIVE_GYM_COOKIE', ACTIVE_GYM_COOKIE);
    this.secure = config.get<string>('COOKIE_SECURE') === 'true';
    this.domain = config.get<string>('COOKIE_DOMAIN', 'localhost');
  }

  set(res: Response, gymId: string): void {
    res.cookie(this.cookieName, gymId, this.options());
  }

  clear(res: Response): void {
    res.clearCookie(this.cookieName, this.options());
  }

  private options(): CookieOptions {
    return { httpOnly: true, sameSite: 'lax', secure: this.secure, domain: this.domain, path: '/' };
  }
}
