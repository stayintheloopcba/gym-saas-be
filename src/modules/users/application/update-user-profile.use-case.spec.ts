import { AuthProvider } from '../../../common/enums/auth-provider.enum';
import { User } from '../domain/user.entity';
import { UserNotFoundError } from '../domain/user.errors';
import { UserRepository } from '../domain/user.repository';
import { UpdateUserProfileUseCase } from './update-user-profile.use-case';

describe('UpdateUserProfileUseCase', () => {
  let users: jest.Mocked<UserRepository>;
  let useCase: UpdateUserProfileUseCase;

  const buildUser = (): User =>
    Object.assign(new User(), {
      id: 'u1',
      email: 'a@b.com',
      name: 'A',
      provider: AuthProvider.LOCAL,
      avatarUrl: null,
    });

  beforeEach(() => {
    users = {
      findById: jest.fn().mockResolvedValue(buildUser()),
      findByEmail: jest.fn(),
      findByGoogleId: jest.fn(),
      save: jest.fn((user: User) => Promise.resolve(user)),
    };
    useCase = new UpdateUserProfileUseCase(users);
  });

  it('updates the name (trimmed)', async () => {
    const updated = await useCase.execute('u1', { name: '  Ada Lovelace  ' });

    expect(updated.name).toBe('Ada Lovelace');
    expect(users.save).toHaveBeenCalled();
  });

  it('throws when the user does not exist', async () => {
    users.findById.mockResolvedValue(null);

    await expect(useCase.execute('missing', { name: 'X' })).rejects.toBeInstanceOf(UserNotFoundError);
  });
});
