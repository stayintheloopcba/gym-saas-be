import { AuthProvider } from '../../../common/enums/auth-provider.enum';
import { User } from '../domain/user.entity';
import { DuplicateEmailError } from '../domain/user.errors';
import { UserRepository } from '../domain/user.repository';
import { CreateUserUseCase } from './create-user.use-case';

describe('CreateUserUseCase', () => {
  let users: jest.Mocked<UserRepository>;
  let useCase: CreateUserUseCase;

  beforeEach(() => {
    users = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByGoogleId: jest.fn(),
      save: jest.fn((u: User) => Promise.resolve(u)),
    };
    useCase = new CreateUserUseCase(users);
  });

  it('rejects a duplicate email', async () => {
    users.findByEmail.mockResolvedValue({ id: 'existing' } as User);

    await expect(
      useCase.execute({ email: 'a@b.com', name: 'A', provider: AuthProvider.LOCAL, passwordHash: 'h' }),
    ).rejects.toBeInstanceOf(DuplicateEmailError);
    expect(users.save).not.toHaveBeenCalled();
  });

  it('normalizes the email before saving and looking up', async () => {
    users.findByEmail.mockResolvedValue(null);

    const created = await useCase.execute({
      email: '  John@Example.COM ',
      name: 'John',
      provider: AuthProvider.LOCAL,
      passwordHash: 'hash',
    });

    expect(users.findByEmail).toHaveBeenCalledWith('john@example.com');
    expect(created.email).toBe('john@example.com');
    expect(created.passwordHash).toBe('hash');
    expect(created.googleId).toBeNull();
  });

  it('creates a GOOGLE user without a password hash', async () => {
    users.findByEmail.mockResolvedValue(null);

    const created = await useCase.execute({
      email: 'g@x.com',
      name: 'G',
      provider: AuthProvider.GOOGLE,
      googleId: 'gid-1',
    });

    expect(created.provider).toBe(AuthProvider.GOOGLE);
    expect(created.googleId).toBe('gid-1');
    expect(created.passwordHash).toBeNull();
  });
});
