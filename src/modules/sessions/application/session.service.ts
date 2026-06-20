import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'crypto';
import { parseDurationMs } from '../../../common/lib/duration';
import type { UserPublicProfile } from '../../users/application/user-public-profile';
import { TOKEN_SERVICE } from '../../auth/application/token-service.port';
import type { TokenPair, TokenPayload, TokenService } from '../../auth/application/token-service.port';
import { Session } from '../domain/session.entity';
import { SESSION_REPOSITORY } from '../domain/session.repository';
import type { SessionRepository } from '../domain/session.repository';

export interface SessionMetadata {
  userAgent?: string;
  ipAddress?: string;
}

export interface SessionView {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: Date;
  lastUsedAt: Date | null;
  expiresAt: Date;
  current: boolean;
}

@Injectable()
export class SessionService {
  private readonly refreshTtlMs: number;

  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepository,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
    config: ConfigService,
  ) {
    this.refreshTtlMs = parseDurationMs(config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'));
  }

  async start(user: UserPublicProfile, metadata: SessionMetadata = {}): Promise<TokenPair> {
    const session = this.buildSession(user.id, randomUUID(), metadata);
    const tokens = await this.tokens.issueTokens({ sub: user.id, email: user.email, sessionId: session.id });
    session.refreshTokenHash = this.hash(tokens.refreshToken);
    await this.sessions.save(session);
    return tokens;
  }

  async rotate(
    refreshToken: string,
    payload: TokenPayload,
    user: UserPublicProfile,
    metadata: SessionMetadata = {},
  ): Promise<TokenPair> {
    const replacement = this.buildSession(user.id, '', metadata);
    const tokens = await this.tokens.issueTokens({
      sub: user.id,
      email: user.email,
      sessionId: replacement.id,
    });
    replacement.refreshTokenHash = this.hash(tokens.refreshToken);

    const result = await this.sessions.rotate(payload.sessionId, user.id, this.hash(refreshToken), replacement);
    if (result !== 'rotated') {
      throw new UnauthorizedException(
        result === 'reused' ? 'Refresh token reuse detected; session family revoked' : 'Invalid refresh token',
      );
    }
    return tokens;
  }

  async list(userId: string, currentSessionId: string): Promise<SessionView[]> {
    const sessions = await this.sessions.findActiveByUser(userId);
    return sessions.map((session) => ({
      id: session.id,
      userAgent: session.userAgent ?? null,
      ipAddress: session.ipAddress ?? null,
      createdAt: session.createdAt,
      lastUsedAt: session.lastUsedAt ?? null,
      expiresAt: session.expiresAt,
      current: session.id === currentSessionId,
    }));
  }

  isActive(userId: string, sessionId: string): Promise<boolean> {
    return this.sessions.isActive(userId, sessionId);
  }

  revoke(userId: string, sessionId: string): Promise<boolean> {
    return this.sessions.revokeOwned(userId, sessionId);
  }

  revokeOthers(userId: string, currentSessionId: string): Promise<number> {
    return this.sessions.revokeAllExcept(userId, currentSessionId);
  }

  private buildSession(userId: string, familyId: string, metadata: SessionMetadata): Session {
    const session = Object.assign(new Session(), {
      id: randomUUID(),
      userId,
      familyId,
      refreshTokenHash: '',
      expiresAt: new Date(Date.now() + this.refreshTtlMs),
      userAgent: metadata.userAgent?.slice(0, 512),
      ipAddress: metadata.ipAddress?.slice(0, 64),
      createdBy: userId,
      updatedBy: userId,
    });
    if (!familyId) {
      session.familyId = session.id;
    }
    return session;
  }

  private hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }
}
