import { UnauthorizedException } from '@nestjs/common';
import { AuthProvider } from '../../../common/enums/auth-provider.enum';
import { FindUserByEmailUseCase } from '../../users/application/find-user.use-cases';
import { User } from '../../users/domain/user.entity';
import { SessionService } from '../../sessions/application/session.service';
import { LoginUseCase } from './login.use-case';
import { PasswordHasher } from './password-hasher.port';

describe('LoginUseCase', () => {
  let findByEmail: jest.Mocked<Pick<FindUserByEmailUseCase, 'execute'>>;
  let hasher: jest.Mocked<PasswordHasher>;
  let sessions: jest.Mocked<Pick<SessionService, 'start'>>;
  let useCase: LoginUseCase;

  const localUser = (): User =>
    Object.assign(new User(), {
      id: 'u1',
      email: 'a@b.com',
      name: 'A',
      provider: AuthProvider.LOCAL,
      passwordHash: 'hashed',
      googleId: null,
      createdAt: new Date(),
    });

  beforeEach(() => {
    findByEmail = { execute: jest.fn() };
    hasher = { hash: jest.fn(), compare: jest.fn() };
    sessions = { start: jest.fn().mockResolvedValue({ accessToken: 'at', refreshToken: 'rt' }) };
    useCase = new LoginUseCase(
      findByEmail as unknown as FindUserByEmailUseCase,
      hasher,
      sessions as unknown as SessionService,
    );
  });

  it('issues tokens on correct credentials', async () => {
    findByEmail.execute.mockResolvedValue(localUser());
    hasher.compare.mockResolvedValue(true);

    const result = await useCase.execute({ email: 'a@b.com', password: 'plain123' });

    expect(result.user.id).toBe('u1');
    expect(result.tokens.accessToken).toBe('at');
  });

  it('rejects a wrong password', async () => {
    findByEmail.execute.mockResolvedValue(localUser());
    hasher.compare.mockResolvedValue(false);

    await expect(useCase.execute({ email: 'a@b.com', password: 'bad' })).rejects.toBeInstanceOf(UnauthorizedException);
    expect(sessions.start).not.toHaveBeenCalled();
  });

  it('rejects a non-existent email', async () => {
    findByEmail.execute.mockResolvedValue(null);

    await expect(useCase.execute({ email: 'no@b.com', password: 'x' })).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects password login on a Google-only account', async () => {
    const googleUser = Object.assign(localUser(), {
      provider: AuthProvider.GOOGLE,
      passwordHash: null,
    });
    findByEmail.execute.mockResolvedValue(googleUser);

    await expect(useCase.execute({ email: 'a@b.com', password: 'x' })).rejects.toBeInstanceOf(UnauthorizedException);
    expect(hasher.compare).not.toHaveBeenCalled();
  });
});
