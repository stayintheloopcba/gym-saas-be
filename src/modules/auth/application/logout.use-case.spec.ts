import { SessionService } from '../../sessions/application/session.service';
import { LogoutUseCase } from './logout.use-case';
import type { TokenService } from './token-service.port';

describe('LogoutUseCase', () => {
  let tokens: jest.Mocked<TokenService>;
  let sessions: jest.Mocked<Pick<SessionService, 'revoke'>>;
  let useCase: LogoutUseCase;

  beforeEach(() => {
    tokens = {
      issueTokens: jest.fn(),
      verifyAccess: jest.fn(),
      verifyRefresh: jest.fn().mockResolvedValue({
        sub: 'user-1',
        email: 'user@example.com',
        sessionId: 'session-1',
      }),
    };
    sessions = { revoke: jest.fn().mockResolvedValue(true) };
    useCase = new LogoutUseCase(tokens, sessions as unknown as SessionService);
  });

  it('revokes the persisted session identified by the refresh token', async () => {
    await useCase.execute('refresh');

    expect(sessions.revoke).toHaveBeenCalledWith('user-1', 'session-1');
  });

  it('remains idempotent for an invalid refresh token', async () => {
    tokens.verifyRefresh.mockRejectedValue(new Error('invalid'));

    await expect(useCase.execute('invalid')).resolves.toBeUndefined();
    expect(sessions.revoke).not.toHaveBeenCalled();
  });
});
