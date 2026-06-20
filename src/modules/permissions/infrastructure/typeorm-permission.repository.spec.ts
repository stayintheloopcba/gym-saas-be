import { Repository } from 'typeorm';
import { MembershipRole } from '../../../common/enums/membership-role.enum';
import { Membership } from '../../memberships/domain/membership.entity';
import { PERMISSIONS } from '../domain/permission-key';
import { PermissionAssignment } from '../domain/permission-assignment.entity';
import { Role } from '../domain/role.entity';
import { TypeOrmPermissionRepository } from './typeorm-permission.repository';

describe('TypeOrmPermissionRepository', () => {
  let memberships: { findOne: jest.Mock };
  let queryBuilder: Record<string, jest.Mock>;
  let assignments: { createQueryBuilder: jest.Mock };
  let roles: { findOne: jest.Mock };
  let repository: TypeOrmPermissionRepository;

  beforeEach(() => {
    memberships = { findOne: jest.fn() };
    queryBuilder = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    assignments = { createQueryBuilder: jest.fn(() => queryBuilder) };
    roles = { findOne: jest.fn() };
    repository = new TypeOrmPermissionRepository(
      memberships as unknown as Repository<Membership>,
      assignments as unknown as Repository<PermissionAssignment>,
      roles as unknown as Repository<Role>,
    );
  });

  it('returns null when the user has no active membership', async () => {
    memberships.findOne.mockResolvedValue(null);

    await expect(repository.findAssignment('user-1', 'org-1')).resolves.toBeNull();
  });

  it('returns the system role and custom role id from the membership', async () => {
    memberships.findOne.mockResolvedValue({ role: MembershipRole.ADMIN, roleId: 'role-admin' });

    await expect(repository.findAssignment('user-1', 'org-1')).resolves.toEqual({
      membershipRole: MembershipRole.ADMIN,
      customRoleId: 'role-admin',
    });
  });

  it('returns an empty list when no permission codes are requested', async () => {
    await expect(
      repository.findGrants({ organizationId: 'org-1', userId: 'user-1', permissionCodes: [] }),
    ).resolves.toEqual([]);
    expect(assignments.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('queries only user-level grants when there is no custom role', async () => {
    await repository.findGrants({
      organizationId: 'org-1',
      userId: 'user-1',
      permissionCodes: [PERMISSIONS.MEMBERS_INVITE],
    });

    expect(queryBuilder.andWhere).toHaveBeenCalledWith('assignment.user_id = :userId', { userId: 'user-1' });
  });

  it('queries user and role grants when there is a custom role', async () => {
    await repository.findGrants({
      organizationId: 'org-1',
      userId: 'user-1',
      roleId: 'role-1',
      permissionCodes: [PERMISSIONS.MEMBERS_INVITE],
    });

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      '(assignment.user_id = :userId OR assignment.role_id = :roleId)',
      { userId: 'user-1', roleId: 'role-1' },
    );
  });

  it('maps rows to grants, deriving the level from the subject', async () => {
    queryBuilder.getMany.mockResolvedValue([
      { permissionCode: PERMISSIONS.MEMBERS_INVITE, value: true, precedence: 10, userId: 'user-1', roleId: null },
      { permissionCode: PERMISSIONS.RESOURCES_READ, value: false, precedence: 5, userId: null, roleId: 'role-1' },
    ]);

    await expect(
      repository.findGrants({
        organizationId: 'org-1',
        userId: 'user-1',
        roleId: 'role-1',
        permissionCodes: [PERMISSIONS.MEMBERS_INVITE, PERMISSIONS.RESOURCES_READ],
      }),
    ).resolves.toEqual([
      { permissionCode: PERMISSIONS.MEMBERS_INVITE, value: true, precedence: 10, level: 'user' },
      { permissionCode: PERMISSIONS.RESOURCES_READ, value: false, precedence: 5, level: 'role' },
    ]);
  });
});
