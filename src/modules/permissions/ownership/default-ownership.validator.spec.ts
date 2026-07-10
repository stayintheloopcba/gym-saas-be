import { HierarchyLevel } from '../../../common/enums/hierarchy-level.enum';
import { DefaultOwnershipValidator, OwnedResource } from './default-ownership.validator';
import { OwnershipContext } from './ownership-context';

const GYM = 'gym-1';
const USER = 'user-1';

const ctx = (hierarchyLevel: HierarchyLevel): OwnershipContext => ({
  userId: USER,
  gymId: GYM,
  hierarchyLevel,
});

const buildValidator = (resource: OwnedResource | null) =>
  new DefaultOwnershipValidator('resource', () => Promise.resolve(resource));

describe('DefaultOwnershipValidator', () => {
  it('reports not found when the resource does not exist', async () => {
    const validator = buildValidator(null);

    await expect(validator.validate('res-1', ctx(HierarchyLevel.GYM))).resolves.toEqual({
      found: false,
      owned: false,
    });
  });

  it('grants GLOBAL access to any existing resource', async () => {
    const validator = buildValidator({ gymId: 'other-gym', createdBy: 'someone' });

    await expect(validator.validate('res-1', ctx(HierarchyLevel.GLOBAL))).resolves.toEqual({
      found: true,
      owned: true,
    });
  });

  it('grants GYM access to resources of the active gym', async () => {
    const validator = buildValidator({ gymId: GYM, createdBy: 'someone-else' });

    await expect(validator.validate('res-1', ctx(HierarchyLevel.GYM))).resolves.toEqual({
      found: true,
      owned: true,
    });
  });

  it('denies GYM access to resources of another gym', async () => {
    const validator = buildValidator({ gymId: 'other-gym', createdBy: USER });

    await expect(validator.validate('res-1', ctx(HierarchyLevel.GYM))).resolves.toEqual({
      found: true,
      owned: false,
    });
  });

  it('grants SELF access only to own resources in the active gym', async () => {
    const validator = buildValidator({ gymId: GYM, createdBy: USER });

    await expect(validator.validate('res-1', ctx(HierarchyLevel.SELF))).resolves.toEqual({
      found: true,
      owned: true,
    });
  });

  it('denies SELF access to resources created by others', async () => {
    const validator = buildValidator({ gymId: GYM, createdBy: 'someone-else' });

    await expect(validator.validate('res-1', ctx(HierarchyLevel.SELF))).resolves.toEqual({
      found: true,
      owned: false,
    });
  });
});
