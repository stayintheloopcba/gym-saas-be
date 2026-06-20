import { SelectQueryBuilder } from 'typeorm';
import { HierarchyLevel } from '../../../common/enums/hierarchy-level.enum';
import { applyOwnershipScope } from './apply-ownership-scope';
import { OwnershipContext } from './ownership-context';

const ctx = (hierarchyLevel: HierarchyLevel): OwnershipContext => ({
  userId: 'user-1',
  organizationId: 'org-1',
  hierarchyLevel,
});

const fakeQb = () => {
  const andWhere = jest.fn().mockReturnThis();
  return { andWhere } as unknown as SelectQueryBuilder<Record<string, unknown>> & { andWhere: jest.Mock };
};

describe('applyOwnershipScope', () => {
  it('adds no filter for GLOBAL', () => {
    const qb = fakeQb();

    applyOwnershipScope(qb, 'resource', ctx(HierarchyLevel.GLOBAL));

    expect(qb.andWhere).not.toHaveBeenCalled();
  });

  it('filters by organization for ORGANIZATION', () => {
    const qb = fakeQb();

    applyOwnershipScope(qb, 'resource', ctx(HierarchyLevel.ORGANIZATION));

    expect(qb.andWhere).toHaveBeenCalledTimes(1);
    expect(qb.andWhere).toHaveBeenCalledWith('resource.organization_id = :ownershipOrgId', {
      ownershipOrgId: 'org-1',
    });
  });

  it('filters by organization and owner for SELF', () => {
    const qb = fakeQb();

    applyOwnershipScope(qb, 'resource', ctx(HierarchyLevel.SELF));

    expect(qb.andWhere).toHaveBeenCalledTimes(2);
    expect(qb.andWhere).toHaveBeenCalledWith('resource.organization_id = :ownershipOrgId', {
      ownershipOrgId: 'org-1',
    });
    expect(qb.andWhere).toHaveBeenCalledWith('resource.created_by = :ownershipUserId', {
      ownershipUserId: 'user-1',
    });
  });
});
