import { Inject, Injectable } from '@nestjs/common';
import { SessionService } from '../../sessions/application/session.service';
import { TOKEN_SERVICE } from './token-service.port';
import type { TokenService } from './token-service.port';

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
    private readonly sessions: SessionService,
  ) {}

  async execute(refreshToken?: string): Promise<void> {
    if (!refreshToken) {
      return;
    }

    try {
      const payload = await this.tokens.verifyRefresh(refreshToken);
      await this.sessions.revoke(payload.sub, payload.sessionId);
    } catch {
      // Logout remains idempotent when the cookie is expired, invalid, or already revoked.
    }
  }
}
