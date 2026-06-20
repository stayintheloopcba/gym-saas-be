import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { AuthProvider } from '../../../common/enums/auth-provider.enum';
import type { TokenService } from '../../auth/application/token-service.port';
import type { UserPublicProfile } from '../../users/application/user-public-profile';
import type { SessionRepository } from '../domain/session.repository';
import { SessionService } from './session.service';

describe('SessionService', () => {
  let repository: jest.Mocked<SessionRepository>;
  let tokens: jest.Mocked<TokenService>;
  let service: SessionService;

  const user: UserPublicProfile = {
    id: 'user-1',
    email: 'user@example.com',
    name: 'User',
    provider: AuthProvider.LOCAL,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    avatarUrl: null,
  };

  beforeEach(() => {
    repository = {
      save: jest.fn(async (session) => session),
      isActive: jest.fn(),
      findActiveByUser: jest.fn(),
      rotate: jest.fn(),
      revokeOwned: jest.fn(),
      revokeAllExcept: jest.fn(),
    };
    tokens = {
      issueTokens: jest.fn().mockResolvedValue({ accessToken: 'access', refreshToken: 'refresh' }),
      verifyAccess: jest.fn(),
      verifyRefresh: jest.fn(),
    };
    const config = {
      get: jest.fn((_key: string, fallback: string) => fallback),
    } as unknown as ConfigService;
    service = new SessionService(repository, tokens, config);
  });

  it('persists a hashed refresh token and session metadata', async () => {
    const result = await service.start(user, { userAgent: 'Browser', ipAddress: '127.0.0.1' });

    expect(result).toEqual({ accessToken: 'access', refreshToken: 'refresh' });
    expect(tokens.issueTokens).toHaveBeenCalledWith(
      expect.objectContaining({ sub: user.id, email: user.email, sessionId: expect.any(String) }),
    );
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: user.id,
        userAgent: 'Browser',
        ipAddress: '127.0.0.1',
        refreshTokenHash: createHash('sha256').update('refresh').digest('hex'),
      }),
    );
  });

  it('rotates a valid refresh token into a replacement session', async () => {
    repository.rotate.mockResolvedValue('rotated');

    const result = await service.rotate(
      'old-refresh',
      { sub: user.id, email: user.email, sessionId: 'old-session' },
      user,
    );

    expect(result.refreshToken).toBe('refresh');
    expect(repository.rotate).toHaveBeenCalledWith(
      'old-session',
      user.id,
      createHash('sha256').update('old-refresh').digest('hex'),
      expect.objectContaining({ userId: user.id, refreshTokenHash: expect.any(String) }),
    );
  });

  it('rejects refresh token reuse after revoking the session family', async () => {
    repository.rotate.mockResolvedValue('reused');

    await expect(
      service.rotate('reused-refresh', { sub: user.id, email: user.email, sessionId: 'old-session' }, user),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('marks the current session in the active-session list', async () => {
    repository.findActiveByUser.mockResolvedValue([
      Object.assign({
        id: 'session-1',
        userAgent: 'Browser',
        ipAddress: '127.0.0.1',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        expiresAt: new Date('2026-01-08T00:00:00Z'),
      }),
    ]);

    const result = await service.list(user.id, 'session-1');

    expect(result).toEqual([expect.objectContaining({ id: 'session-1', current: true, lastUsedAt: null })]);
  });
});
