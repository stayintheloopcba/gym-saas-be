import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import {
  ImageUploadValidator,
  MAX_IMAGE_SIZE_BYTES,
  UploadCandidate,
} from '../../storage/application/image-upload.validator';
import { FileStorage } from '../../storage/domain/file-storage.port';
import { FileTooLargeError, InvalidFileTypeError } from '../../storage/domain/storage.errors';
import { Gym } from '../domain/gym.entity';
import { GymNotFoundError } from '../domain/gym.errors';
import { GymRepository } from '../domain/gym.repository';
import { SetGymImageUseCase } from './set-gym-image.use-case';

const pngFile = (overrides: Partial<UploadCandidate> = {}): UploadCandidate => ({
  mimetype: 'image/png',
  size: 1024,
  buffer: Buffer.from('img'),
  ...overrides,
});

describe('SetGymImageUseCase', () => {
  let gyms: jest.Mocked<GymRepository>;
  let permissions: jest.Mocked<Pick<GymPermissionService, 'requirePermission'>>;
  let storage: jest.Mocked<FileStorage>;
  let useCase: SetGymImageUseCase;

  const buildOrg = (): Gym =>
    Object.assign(new Gym(), { id: 'gym-1', name: 'Acme', slug: 'acme', logoUrl: null, bannerUrl: null });

  beforeEach(() => {
    gyms = {
      findById: jest.fn().mockResolvedValue(buildOrg()),
      findBySlug: jest.fn(),
      save: jest.fn((org: Gym) => Promise.resolve(org)),
      softDelete: jest.fn(),
    };
    permissions = { requirePermission: jest.fn().mockResolvedValue(undefined) };
    storage = { put: jest.fn().mockResolvedValue('https://minio/generic-saas/gym/gym-1/logo-x.png') };
    useCase = new SetGymImageUseCase(
      gyms,
      permissions as unknown as GymPermissionService,
      storage,
      new ImageUploadValidator(),
    );
  });

  it('uploads a logo and persists its URL', async () => {
    const updated = await useCase.execute('u1', 'gym-1', 'logo', pngFile());

    expect(storage.put).toHaveBeenCalledWith(
      expect.objectContaining({ contentType: 'image/png', key: expect.stringMatching(/^gym\/gym-1\/logo-.*\.png$/) }),
    );
    expect(updated.logoUrl).toBe('https://minio/generic-saas/gym/gym-1/logo-x.png');
    expect(updated.bannerUrl).toBeNull();
  });

  it('uploads a banner to the banner column', async () => {
    storage.put.mockResolvedValue('https://minio/generic-saas/gym/gym-1/banner-x.png');
    const updated = await useCase.execute('u1', 'gym-1', 'banner', pngFile());

    expect(updated.bannerUrl).toBe('https://minio/generic-saas/gym/gym-1/banner-x.png');
    expect(updated.logoUrl).toBeNull();
  });

  it('requires ORGANIZATION_UPDATE before uploading', async () => {
    permissions.requirePermission.mockRejectedValue(new Error('forbidden'));

    await expect(useCase.execute('u1', 'gym-1', 'logo', pngFile())).rejects.toThrow('forbidden');
    expect(storage.put).not.toHaveBeenCalled();
  });

  it('rejects a non-image type without storing', async () => {
    await expect(
      useCase.execute('u1', 'gym-1', 'logo', pngFile({ mimetype: 'application/pdf' })),
    ).rejects.toBeInstanceOf(InvalidFileTypeError);
    expect(storage.put).not.toHaveBeenCalled();
  });

  it('rejects a file over the size limit without storing', async () => {
    await expect(
      useCase.execute('u1', 'gym-1', 'logo', pngFile({ size: MAX_IMAGE_SIZE_BYTES + 1 })),
    ).rejects.toBeInstanceOf(FileTooLargeError);
    expect(storage.put).not.toHaveBeenCalled();
  });

  it('throws when the gym does not exist', async () => {
    gyms.findById.mockResolvedValue(null);

    await expect(useCase.execute('u1', 'missing', 'logo', pngFile())).rejects.toBeInstanceOf(GymNotFoundError);
  });
});
