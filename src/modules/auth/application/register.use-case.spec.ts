import { AuthProvider } from '../../../common/enums/auth-provider.enum';
import { CreateGymUseCase } from '../../gyms/application/create-gym.use-case';
import { Gym } from '../../gyms/domain/gym.entity';
import { CreateUserUseCase } from '../../users/application/create-user.use-case';
import { User } from '../../users/domain/user.entity';
import { DuplicateEmailError } from '../../users/domain/user.errors';
import { SessionService } from '../../sessions/application/session.service';
import { PasswordHasher } from './password-hasher.port';
import { RegisterUseCase } from './register.use-case';

describe('RegisterUseCase', () => {
  let createUser: jest.Mocked<Pick<CreateUserUseCase, 'execute'>>;
  let createGym: jest.Mocked<Pick<CreateGymUseCase, 'execute'>>;
  let hasher: jest.Mocked<PasswordHasher>;
  let sessions: jest.Mocked<Pick<SessionService, 'start'>>;
  let useCase: RegisterUseCase;

  const buildUser = (): User =>
    Object.assign(new User(), {
      id: 'u1',
      email: 'a@b.com',
      name: 'A',
      provider: AuthProvider.LOCAL,
      passwordHash: 'hashed',
      googleId: null,
      createdAt: new Date('2026-01-01T00:00:00Z'),
    });

  const buildOrg = (): Gym => Object.assign(new Gym(), { id: 'gym-1', name: 'Acme', slug: 'acme' });

  const command = { email: 'a@b.com', password: 'plain123', name: 'A', gymName: 'Acme' };

  beforeEach(() => {
    createUser = { execute: jest.fn().mockResolvedValue(buildUser()) };
    createGym = { execute: jest.fn().mockResolvedValue(buildOrg()) };
    hasher = { hash: jest.fn().mockResolvedValue('hashed'), compare: jest.fn() };
    sessions = { start: jest.fn().mockResolvedValue({ accessToken: 'at', refreshToken: 'rt' }) };
    useCase = new RegisterUseCase(
      createUser as unknown as CreateUserUseCase,
      createGym as unknown as CreateGymUseCase,
      hasher,
      sessions as unknown as SessionService,
    );
  });

  it('hashes the password, creates a LOCAL user and provisions an gym', async () => {
    const result = await useCase.execute(command);

    expect(hasher.hash).toHaveBeenCalledWith('plain123');
    expect(createUser.execute).toHaveBeenCalledWith(
      expect.objectContaining({ provider: AuthProvider.LOCAL, passwordHash: 'hashed' }),
    );
    expect(createGym.execute).toHaveBeenCalledWith({ ownerUserId: 'u1', name: 'Acme' });
    expect(result.tokens).toEqual({ accessToken: 'at', refreshToken: 'rt' });
    expect(result.activeGymId).toBe('gym-1');
    // El perfil público nunca expone el hash.
    expect((result.user as unknown as Record<string, unknown>).passwordHash).toBeUndefined();
  });

  it('propagates a duplicate-email error from user creation', async () => {
    createUser.execute.mockRejectedValue(new DuplicateEmailError('a@b.com'));

    await expect(useCase.execute(command)).rejects.toBeInstanceOf(DuplicateEmailError);
    expect(createGym.execute).not.toHaveBeenCalled();
  });
});
