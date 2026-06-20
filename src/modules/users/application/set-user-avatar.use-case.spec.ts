import {
  ImageUploadValidator,
  MAX_IMAGE_SIZE_BYTES,
  UploadCandidate,
} from '../../storage/application/image-upload.validator';
import { FileStorage } from '../../storage/domain/file-storage.port';
import { FileTooLargeError, InvalidFileTypeError } from '../../storage/domain/storage.errors';
import { User } from '../domain/user.entity';
import { UserNotFoundError } from '../domain/user.errors';
import { UserRepository } from '../domain/user.repository';
import { SetUserAvatarUseCase } from './set-user-avatar.use-case';

const pngFile = (overrides: Partial<UploadCandidate> = {}): UploadCandidate => ({
  mimetype: 'image/png',
  size: 1024,
  buffer: Buffer.from('img'),
  ...overrides,
});

describe('SetUserAvatarUseCase', () => {
  let users: jest.Mocked<UserRepository>;
  let storage: jest.Mocked<FileStorage>;
  let useCase: SetUserAvatarUseCase;

  const buildUser = (): User => Object.assign(new User(), { id: 'u1', name: 'Ada', avatarUrl: null });

  beforeEach(() => {
    users = {
      findById: jest.fn().mockResolvedValue(buildUser()),
      findByEmail: jest.fn(),
      findByGoogleId: jest.fn(),
      save: jest.fn((u: User) => Promise.resolve(u)),
    };
    storage = { put: jest.fn().mockResolvedValue('https://minio/generic-saas/users/u1/avatar-x.png') };
    useCase = new SetUserAvatarUseCase(users, storage, new ImageUploadValidator());
  });

  it('uploads an avatar and persists its URL', async () => {
    const updated = await useCase.execute('u1', pngFile());

    expect(storage.put).toHaveBeenCalledWith(
      expect.objectContaining({ key: expect.stringMatching(/^users\/u1\/avatar-.*\.png$/) }),
    );
    expect(updated.avatarUrl).toBe('https://minio/generic-saas/users/u1/avatar-x.png');
  });

  it('rejects a non-image type without storing', async () => {
    await expect(useCase.execute('u1', pngFile({ mimetype: 'text/plain' }))).rejects.toBeInstanceOf(
      InvalidFileTypeError,
    );
    expect(storage.put).not.toHaveBeenCalled();
  });

  it('rejects a file over the size limit without storing', async () => {
    await expect(useCase.execute('u1', pngFile({ size: MAX_IMAGE_SIZE_BYTES + 1 }))).rejects.toBeInstanceOf(
      FileTooLargeError,
    );
    expect(storage.put).not.toHaveBeenCalled();
  });

  it('throws when the user does not exist', async () => {
    users.findById.mockResolvedValue(null);

    await expect(useCase.execute('missing', pngFile())).rejects.toBeInstanceOf(UserNotFoundError);
  });
});
