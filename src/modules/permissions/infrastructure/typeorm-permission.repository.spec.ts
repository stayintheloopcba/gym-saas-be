import { Repository } from 'typeorm';
import { HierarchyLevel } from '../../../common/enums/hierarchy-level.enum';
import { Membership } from '../../memberships/domain/membership.entity';
import { RolePermission } from '../domain/role-permission.entity';
import { Role } from '../domain/role.entity';
import { TypeOrmPermissionRepository } from './typeorm-permission.repository';

describe('TypeOrmPermissionRepository', () => {
  let memberships: { findOne: jest.Mock };
  let roles: { findOne: jest.Mock };
  let rolePermissions: { find: jest.Mock };
  let repository: TypeOrmPermissionRepository;

  beforeEach(() => {
    memberships = { findOne: jest.fn() };
    roles = { findOne: jest.fn() };
    rolePermissions = { find: jest.fn().mockResolvedValue([]) };
    repository = new TypeOrmPermissionRepository(
      memberships as unknown as Repository<Membership>,
      roles as unknown as Repository<Role>,
      rolePermissions as unknown as Repository<RolePermission>,
    );
  });

  it('returns null when the user has no active membership', async () => {
    memberships.findOne.mockResolvedValue(null);

    await expect(repository.findMembershipRole('user-1', 'gym-1')).resolves.toBeNull();
  });

  it('returns null when the membership references a role that no longer exists', async () => {
    memberships.findOne.mockResolvedValue({ roleId: 'role-1' });
    roles.findOne.mockResolvedValue(null);

    await expect(repository.findMembershipRole('user-1', 'gym-1')).resolves.toBeNull();
  });

  it('returns the catalog role assigned to the membership', async () => {
    memberships.findOne.mockResolvedValue({ roleId: 'role-1' });
    roles.findOne.mockResolvedValue({
      id: 'role-1',
      key: 'admin',
      name: 'Administrador',
      hierarchyLevel: HierarchyLevel.GYM,
    });

    await expect(repository.findMembershipRole('user-1', 'gym-1')).resolves.toEqual({
      roleId: 'role-1',
      roleKey: 'admin',
      roleName: 'Administrador',
      hierarchyLevel: HierarchyLevel.GYM,
    });
  });

  it('returns the permission codes granted to a role', async () => {
    rolePermissions.find.mockResolvedValue([{ permissionCode: 'members:read' }, { permissionCode: 'members:invite' }]);

    await expect(repository.findPermissionCodes('role-1')).resolves.toEqual(['members:read', 'members:invite']);
  });

  it('returns a role summary, or null if the role does not exist', async () => {
    roles.findOne.mockResolvedValue({ id: 'role-1', key: 'admin', name: 'Administrador' });
    await expect(repository.findRoleSummary('role-1')).resolves.toEqual({
      id: 'role-1',
      key: 'admin',
      name: 'Administrador',
    });

    roles.findOne.mockResolvedValue(null);
    await expect(repository.findRoleSummary('role-2')).resolves.toBeNull();
  });
});
