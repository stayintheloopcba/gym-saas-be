import { UnauthorizedException } from '@nestjs/common';
import { AuthProvider } from '../../../common/enums/auth-provider.enum';
import { SessionService } from '../../sessions/application/session.service';
import { FindUserByIdUseCase } from '../../users/application/find-user.use-cases';
import { User } from '../../users/domain/user.entity';
import { RefreshTokenUseCase } from './refresh-token.use-case';
import type { TokenService } from './token-service.port';

describe('RefreshTokenUseCase', () => {
  let findById: jest.Mocked<Pick<FindUserByIdUseCase, 'execute'>>;
  let tokens: jest.Mocked<TokenService>;
  let sessions: jest.Mocked<Pick<SessionService, 'rotate'>>;
  let useCase: RefreshTokenUseCase;

  const user = Object.assign(new User(), {
    id: 'user-1',
    email: 'user@example.com',
    name: 'User',
    provider: AuthProvider.LOCAL,
    passwordHash: 'hash',
    googleId: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
  });

  beforeEach(() => {
    findById = { execute: jest.fn() };
    tokens = {
      issueTokens: jest.fn(),
      verifyAccess: jest.fn(),
      verifyRefresh: jest.fn().mockResolvedValue({
        sub: user.id,
        email: user.email,
        sessionId: 'session-1',
      }),
    };
    sessions = {
      rotate: jest.fn().mockResolvedValue({ accessToken: 'new-access', refreshToken: 'new-refresh' }),
    };
    useCase = new RefreshTokenUseCase(
      findById as unknown as FindUserByIdUseCase,
      tokens,
      sessions as unknown as SessionService,
    );
  });

  it('revalidates the user and rotates the persisted session', async () => {
    findById.execute.mockResolvedValue(user);

    const result = await useCase.execute('refresh', { userAgent: 'Browser' });

    expect(sessions.rotate).toHaveBeenCalledWith(
      'refresh',
      expect.objectContaining({ sessionId: 'session-1' }),
      expect.objectContaining({ id: user.id }),
      { userAgent: 'Browser' },
    );
    expect(result.tokens.refreshToken).toBe('new-refresh');
  });

  it('rejects a refresh token whose user no longer exists', async () => {
    findById.execute.mockResolvedValue(null);

    await expect(useCase.execute('refresh')).rejects.toThrow(UnauthorizedException);
    expect(sessions.rotate).not.toHaveBeenCalled();
  });
});
