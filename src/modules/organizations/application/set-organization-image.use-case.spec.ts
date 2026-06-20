import { OrganizationPermissionService } from '../../permissions/application/organization-permission.service';
import {
  ImageUploadValidator,
  MAX_IMAGE_SIZE_BYTES,
  UploadCandidate,
} from '../../storage/application/image-upload.validator';
import { FileStorage } from '../../storage/domain/file-storage.port';
import { FileTooLargeError, InvalidFileTypeError } from '../../storage/domain/storage.errors';
import { Organization } from '../domain/organization.entity';
import { OrganizationNotFoundError } from '../domain/organization.errors';
import { OrganizationRepository } from '../domain/organization.repository';
import { SetOrganizationImageUseCase } from './set-organization-image.use-case';

const pngFile = (overrides: Partial<UploadCandidate> = {}): UploadCandidate => ({
  mimetype: 'image/png',
  size: 1024,
  buffer: Buffer.from('img'),
  ...overrides,
});

describe('SetOrganizationImageUseCase', () => {
  let organizations: jest.Mocked<OrganizationRepository>;
  let permissions: jest.Mocked<Pick<OrganizationPermissionService, 'requirePermission'>>;
  let storage: jest.Mocked<FileStorage>;
  let useCase: SetOrganizationImageUseCase;

  const buildOrg = (): Organization =>
    Object.assign(new Organization(), { id: 'org-1', name: 'Acme', slug: 'acme', logoUrl: null, bannerUrl: null });

  beforeEach(() => {
    organizations = {
      findById: jest.fn().mockResolvedValue(buildOrg()),
      findBySlug: jest.fn(),
      save: jest.fn((org: Organization) => Promise.resolve(org)),
      softDelete: jest.fn(),
    };
    permissions = { requirePermission: jest.fn().mockResolvedValue(undefined) };
    storage = { put: jest.fn().mockResolvedValue('https://minio/generic-saas/org/org-1/logo-x.png') };
    useCase = new SetOrganizationImageUseCase(
      organizations,
      permissions as unknown as OrganizationPermissionService,
      storage,
      new ImageUploadValidator(),
    );
  });

  it('uploads a logo and persists its URL', async () => {
    const updated = await useCase.execute('u1', 'org-1', 'logo', pngFile());

    expect(storage.put).toHaveBeenCalledWith(
      expect.objectContaining({ contentType: 'image/png', key: expect.stringMatching(/^org\/org-1\/logo-.*\.png$/) }),
    );
    expect(updated.logoUrl).toBe('https://minio/generic-saas/org/org-1/logo-x.png');
    expect(updated.bannerUrl).toBeNull();
  });

  it('uploads a banner to the banner column', async () => {
    storage.put.mockResolvedValue('https://minio/generic-saas/org/org-1/banner-x.png');
    const updated = await useCase.execute('u1', 'org-1', 'banner', pngFile());

    expect(updated.bannerUrl).toBe('https://minio/generic-saas/org/org-1/banner-x.png');
    expect(updated.logoUrl).toBeNull();
  });

  it('requires ORGANIZATION_UPDATE before uploading', async () => {
    permissions.requirePermission.mockRejectedValue(new Error('forbidden'));

    await expect(useCase.execute('u1', 'org-1', 'logo', pngFile())).rejects.toThrow('forbidden');
    expect(storage.put).not.toHaveBeenCalled();
  });

  it('rejects a non-image type without storing', async () => {
    await expect(
      useCase.execute('u1', 'org-1', 'logo', pngFile({ mimetype: 'application/pdf' })),
    ).rejects.toBeInstanceOf(InvalidFileTypeError);
    expect(storage.put).not.toHaveBeenCalled();
  });

  it('rejects a file over the size limit without storing', async () => {
    await expect(
      useCase.execute('u1', 'org-1', 'logo', pngFile({ size: MAX_IMAGE_SIZE_BYTES + 1 })),
    ).rejects.toBeInstanceOf(FileTooLargeError);
    expect(storage.put).not.toHaveBeenCalled();
  });

  it('throws when the organization does not exist', async () => {
    organizations.findById.mockResolvedValue(null);

    await expect(useCase.execute('u1', 'missing', 'logo', pngFile())).rejects.toBeInstanceOf(OrganizationNotFoundError);
  });
});
