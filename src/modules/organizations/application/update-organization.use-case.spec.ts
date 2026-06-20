import { OrganizationPermissionService } from '../../permissions/application/organization-permission.service';
import { Organization } from '../domain/organization.entity';
import { OrganizationNotFoundError } from '../domain/organization.errors';
import { OrganizationRepository } from '../domain/organization.repository';
import { UpdateOrganizationUseCase } from './update-organization.use-case';

describe('UpdateOrganizationUseCase', () => {
  let organizations: jest.Mocked<OrganizationRepository>;
  let permissions: jest.Mocked<Pick<OrganizationPermissionService, 'requirePermission'>>;
  let useCase: UpdateOrganizationUseCase;

  const buildOrg = (): Organization =>
    Object.assign(new Organization(), {
      id: 'org-1',
      name: 'Acme',
      slug: 'acme',
      primaryColor: null,
      secondaryColor: null,
      fontFamily: null,
    });

  beforeEach(() => {
    organizations = {
      findById: jest.fn().mockResolvedValue(buildOrg()),
      findBySlug: jest.fn(),
      save: jest.fn((org: Organization) => Promise.resolve(org)),
      softDelete: jest.fn(),
    };
    permissions = { requirePermission: jest.fn().mockResolvedValue(undefined) };
    useCase = new UpdateOrganizationUseCase(organizations, permissions as unknown as OrganizationPermissionService);
  });

  it('applies only the provided fields', async () => {
    const updated = await useCase.execute('u1', 'org-1', { primaryColor: '#0F62FE', fontFamily: 'Inter' });

    expect(updated.primaryColor).toBe('#0F62FE');
    expect(updated.fontFamily).toBe('Inter');
    // name no provisto → se conserva
    expect(updated.name).toBe('Acme');
    expect(organizations.save).toHaveBeenCalled();
  });

  it('requires ORGANIZATION_UPDATE before mutating', async () => {
    permissions.requirePermission.mockRejectedValue(new Error('forbidden'));

    await expect(useCase.execute('u1', 'org-1', { name: 'New' })).rejects.toThrow('forbidden');
    expect(organizations.save).not.toHaveBeenCalled();
  });

  it('throws when the organization does not exist', async () => {
    organizations.findById.mockResolvedValue(null);

    await expect(useCase.execute('u1', 'missing', { name: 'New' })).rejects.toBeInstanceOf(OrganizationNotFoundError);
  });
});
