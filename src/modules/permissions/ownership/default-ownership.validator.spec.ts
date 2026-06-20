import { HierarchyLevel } from '../../../common/enums/hierarchy-level.enum';
import { DefaultOwnershipValidator, OwnedResource } from './default-ownership.validator';
import { OwnershipContext } from './ownership-context';

const ORG = 'org-1';
const USER = 'user-1';

const ctx = (hierarchyLevel: HierarchyLevel): OwnershipContext => ({
  userId: USER,
  organizationId: ORG,
  hierarchyLevel,
});

const buildValidator = (resource: OwnedResource | null) =>
  new DefaultOwnershipValidator('resource', () => Promise.resolve(resource));

describe('DefaultOwnershipValidator', () => {
  it('reports not found when the resource does not exist', async () => {
    const validator = buildValidator(null);

    await expect(validator.validate('res-1', ctx(HierarchyLevel.ORGANIZATION))).resolves.toEqual({
      found: false,
      owned: false,
    });
  });

  it('grants GLOBAL access to any existing resource', async () => {
    const validator = buildValidator({ organizationId: 'other-org', createdBy: 'someone' });

    await expect(validator.validate('res-1', ctx(HierarchyLevel.GLOBAL))).resolves.toEqual({
      found: true,
      owned: true,
    });
  });

  it('grants ORGANIZATION access to resources of the active organization', async () => {
    const validator = buildValidator({ organizationId: ORG, createdBy: 'someone-else' });

    await expect(validator.validate('res-1', ctx(HierarchyLevel.ORGANIZATION))).resolves.toEqual({
      found: true,
      owned: true,
    });
  });

  it('denies ORGANIZATION access to resources of another organization', async () => {
    const validator = buildValidator({ organizationId: 'other-org', createdBy: USER });

    await expect(validator.validate('res-1', ctx(HierarchyLevel.ORGANIZATION))).resolves.toEqual({
      found: true,
      owned: false,
    });
  });

  it('grants SELF access only to own resources in the active organization', async () => {
    const validator = buildValidator({ organizationId: ORG, createdBy: USER });

    await expect(validator.validate('res-1', ctx(HierarchyLevel.SELF))).resolves.toEqual({
      found: true,
      owned: true,
    });
  });

  it('denies SELF access to resources created by others', async () => {
    const validator = buildValidator({ organizationId: ORG, createdBy: 'someone-else' });

    await expect(validator.validate('res-1', ctx(HierarchyLevel.SELF))).resolves.toEqual({
      found: true,
      owned: false,
    });
  });
});
