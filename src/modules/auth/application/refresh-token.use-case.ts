import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { FindUserByIdUseCase } from '../../users/application/find-user.use-cases';
import { toPublicProfile } from '../../users/application/user-public-profile';
import { SessionMetadata, SessionService } from '../../sessions/application/session.service';
import { AuthResult } from './auth-result';
import { TOKEN_SERVICE } from './token-service.port';
import type { TokenService } from './token-service.port';

/**
 * Verifica el refresh token y emite un nuevo par de tokens. Revalida que el
 * usuario siga existiendo (no eliminado) antes de renovar.
 */
@Injectable()
export class RefreshTokenUseCase {
  constructor(
    private readonly findById: FindUserByIdUseCase,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
    private readonly sessions: SessionService,
  ) {}

  async execute(refreshToken: string, metadata: SessionMetadata = {}): Promise<AuthResult> {
    const payload = await this.tokens.verifyRefresh(refreshToken);

    const user = await this.findById.execute(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const profile = toPublicProfile(user);
    const tokens = await this.sessions.rotate(refreshToken, payload, profile, metadata);
    return { user: profile, tokens };
  }
}
