import { Inject, Injectable, NestMiddleware, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { AuthContext, authContextStorage } from './auth-context.store';
import { ACTIVE_GYM_COOKIE, MEMBERSHIP_CONTEXT_PORT } from './membership-context.port';
import type { MembershipContextPort } from './membership-context.port';

const ACCESS_TOKEN_COOKIE = 'access_token';
const REQUEST_ID_HEADER = 'x-request-id';
const SAFE_REQUEST_ID = /^[A-Za-z0-9._:-]{1,128}$/;

interface AccessTokenPayload {
  sub: string;
  sessionId: string;
}

/**
 * Creates an isolated request context and enriches it with authenticated user
 * and active-gym data when their cookies are valid.
 */
@Injectable()
export class AuthContextMiddleware implements NestMiddleware {
  private readonly accessSecret: string;
  private readonly activeGymCookie: string;

  constructor(
    private readonly jwt: JwtService,
    config: ConfigService,
    @Optional()
    @Inject(MEMBERSHIP_CONTEXT_PORT)
    private readonly membershipContext?: MembershipContextPort,
  ) {
    this.accessSecret = config.getOrThrow<string>('JWT_ACCESS_SECRET');
    this.activeGymCookie = config.get<string>('ACTIVE_GYM_COOKIE', ACTIVE_GYM_COOKIE);
  }

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const requestId = this.resolveRequestId(req.get(REQUEST_ID_HEADER));
    res.setHeader(REQUEST_ID_HEADER, requestId);

    const cookies = req.cookies as Record<string, string> | undefined;
    const token = cookies?.[ACCESS_TOKEN_COOKIE];
    const context: AuthContext = { requestId };

    if (!token) {
      authContextStorage.run(context, () => next());
      return;
    }

    let accountId: string;
    try {
      const payload = this.jwt.verify<AccessTokenPayload>(token, { secret: this.accessSecret });
      accountId = payload.sub;
      context.accountId = accountId;
      context.sessionId = payload.sessionId;
    } catch {
      authContextStorage.run(context, () => next());
      return;
    }

    const candidateGymId = cookies?.[this.activeGymCookie];
    if (candidateGymId && this.membershipContext) {
      try {
        if (await this.membershipContext.isActiveMember(accountId, candidateGymId)) {
          context.activeGymId = candidateGymId;
        }
      } catch {
        // A validation failure leaves the request without an active gym.
      }
    }

    authContextStorage.run(context, () => next());
  }

  private resolveRequestId(candidate?: string): string {
    return candidate && SAFE_REQUEST_ID.test(candidate) ? candidate : randomUUID();
  }
}
