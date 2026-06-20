import { AuthProvider } from '../../../common/enums/auth-provider.enum';
import { CreateUserUseCase } from '../../users/application/create-user.use-case';
import { FindUserByEmailUseCase, FindUserByGoogleIdUseCase } from '../../users/application/find-user.use-cases';
import { User } from '../../users/domain/user.entity';
import { UserRepository } from '../../users/domain/user.repository';
import { SessionService } from '../../sessions/application/session.service';
import { GoogleAuthUseCase, GoogleProfile } from './google-auth.use-case';

describe('GoogleAuthUseCase', () => {
  let findByGoogleId: jest.Mocked<Pick<FindUserByGoogleIdUseCase, 'execute'>>;
  let findByEmail: jest.Mocked<Pick<FindUserByEmailUseCase, 'execute'>>;
  let createUser: jest.Mocked<Pick<CreateUserUseCase, 'execute'>>;
  let users: jest.Mocked<UserRepository>;
  let sessions: jest.Mocked<Pick<SessionService, 'start'>>;
  let useCase: GoogleAuthUseCase;

  const profile: GoogleProfile = { googleId: 'gid-1', email: 'g@x.com', name: 'G' };

  const userWith = (overrides: Partial<User>): User =>
    Object.assign(new User(), {
      id: 'u1',
      email: 'g@x.com',
      name: 'G',
      provider: AuthProvider.GOOGLE,
      passwordHash: null,
      googleId: 'gid-1',
      createdAt: new Date(),
      ...overrides,
    });

  beforeEach(() => {
    findByGoogleId = { execute: jest.fn() };
    findByEmail = { execute: jest.fn() };
    createUser = { execute: jest.fn() };
    users = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByGoogleId: jest.fn(),
      save: jest.fn((u: User) => Promise.resolve(u)),
    };
    sessions = { start: jest.fn().mockResolvedValue({ accessToken: 'at', refreshToken: 'rt' }) };
    useCase = new GoogleAuthUseCase(
      findByGoogleId as unknown as FindUserByGoogleIdUseCase,
      findByEmail as unknown as FindUserByEmailUseCase,
      createUser as unknown as CreateUserUseCase,
      users,
      sessions as unknown as SessionService,
    );
  });

  it('returns the existing user when matched by googleId', async () => {
    findByGoogleId.execute.mockResolvedValue(userWith({}));

    const result = await useCase.execute(profile);

    expect(result.user.id).toBe('u1');
    expect(createUser.execute).not.toHaveBeenCalled();
    expect(users.save).not.toHaveBeenCalled();
  });

  it('links the googleId to an existing account matched by email', async () => {
    findByGoogleId.execute.mockResolvedValue(null);
    const localAccount = userWith({ provider: AuthProvider.LOCAL, passwordHash: 'h', googleId: null });
    findByEmail.execute.mockResolvedValue(localAccount);

    const result = await useCase.execute(profile);

    expect(users.save).toHaveBeenCalledWith(expect.objectContaining({ googleId: 'gid-1' }));
    expect(createUser.execute).not.toHaveBeenCalled();
    expect(result.tokens.accessToken).toBe('at');
  });

  it('creates a new GOOGLE user when nothing matches', async () => {
    findByGoogleId.execute.mockResolvedValue(null);
    findByEmail.execute.mockResolvedValue(null);
    createUser.execute.mockResolvedValue(userWith({}));

    const result = await useCase.execute(profile);

    expect(createUser.execute).toHaveBeenCalledWith(
      expect.objectContaining({ provider: AuthProvider.GOOGLE, googleId: 'gid-1' }),
    );
    expect(result.user.id).toBe('u1');
  });
});
