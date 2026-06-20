import { Organization } from '../domain/organization.entity';
import { OrganizationRepository } from '../domain/organization.repository';
import { CreateOrganizationUseCase } from './create-organization.use-case';
import { OrgUnitOfWork } from './org-unit-of-work.port';

describe('CreateOrganizationUseCase', () => {
  let organizations: jest.Mocked<OrganizationRepository>;
  let unitOfWork: jest.Mocked<OrgUnitOfWork>;
  let useCase: CreateOrganizationUseCase;

  beforeEach(() => {
    organizations = {
      findById: jest.fn(),
      findBySlug: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    };
    unitOfWork = {
      createOrganizationWithOwner: jest.fn((org: Organization, _ownerUserId: string) => Promise.resolve(org)),
    };
    useCase = new CreateOrganizationUseCase(organizations, unitOfWork);
  });

  it('derives a unique slug with a numeric suffix on collision', async () => {
    organizations.findBySlug.mockImplementation((slug) =>
      Promise.resolve(slug === 'acme' ? ({ id: 'existing' } as Organization) : null),
    );

    const org = await useCase.execute({ ownerUserId: 'u1', name: 'Acme' });

    expect(org.slug).toBe('acme-2');
  });

  it('creates the org and OWNER membership atomically via the unit of work', async () => {
    organizations.findBySlug.mockResolvedValue(null);

    await useCase.execute({ ownerUserId: 'u1', name: 'Acme' });

    expect(unitOfWork.createOrganizationWithOwner).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Acme', slug: 'acme' }),
      'u1',
    );
  });

  it('falls back to a default slug when the name yields no url-safe characters', async () => {
    organizations.findBySlug.mockResolvedValue(null);

    const org = await useCase.execute({ ownerUserId: 'u1', name: '—' });

    expect(org.slug).toBe('org');
  });

  it('sets a 7-day cosmetic trial on creation', async () => {
    organizations.findBySlug.mockResolvedValue(null);

    const before = Date.now();
    const org = await useCase.execute({ ownerUserId: 'u1', name: 'Acme' });
    const after = Date.now();

    expect(org.trialEndsAt).toBeInstanceOf(Date);
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    expect(org.trialEndsAt!.getTime()).toBeGreaterThanOrEqual(before + sevenDays);
    expect(org.trialEndsAt!.getTime()).toBeLessThanOrEqual(after + sevenDays);
  });
});
