import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthProvider } from '../../../common/enums/auth-provider.enum';
import { SessionService } from '../../sessions/application/session.service';
import { FindUserByIdUseCase } from '../../users/application/find-user.use-cases';
import { User } from '../../users/domain/user.entity';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let findById: jest.Mocked<Pick<FindUserByIdUseCase, 'execute'>>;
  let sessions: jest.Mocked<Pick<SessionService, 'isActive'>>;
  let strategy: JwtStrategy;

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
    findById = { execute: jest.fn().mockResolvedValue(user) };
    sessions = { isActive: jest.fn().mockResolvedValue(true) };
    const config = { getOrThrow: jest.fn(() => 'secret') } as unknown as ConfigService;
    strategy = new JwtStrategy(
      config,
      findById as unknown as FindUserByIdUseCase,
      sessions as unknown as SessionService,
    );
  });

  it('returns an authenticated principal for an active persisted session', async () => {
    const principal = await strategy.validate({
      sub: user.id,
      email: user.email,
      sessionId: 'session-1',
    });

    expect(principal.user.id).toBe(user.id);
    expect(principal.sessionId).toBe('session-1');
  });

  it('rejects an access token after its session is revoked', async () => {
    sessions.isActive.mockResolvedValue(false);

    await expect(strategy.validate({ sub: user.id, email: user.email, sessionId: 'session-1' })).rejects.toThrow(
      UnauthorizedException,
    );
    expect(findById.execute).not.toHaveBeenCalled();
  });
});
