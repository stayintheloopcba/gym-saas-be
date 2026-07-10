import { Repository } from 'typeorm';
import { HierarchyLevel } from '../../../common/enums/hierarchy-level.enum';
import { Member } from '../../members/domain/member.entity';
import { RolePermission } from '../domain/role-permission.entity';
import { Role } from '../domain/role.entity';
import { TypeOrmPermissionRepository } from './typeorm-permission.repository';

describe('TypeOrmPermissionRepository', () => {
  let members: { findOne: jest.Mock };
  let roles: { findOne: jest.Mock };
  let rolePermissions: { find: jest.Mock };
  let repository: TypeOrmPermissionRepository;

  beforeEach(() => {
    members = { findOne: jest.fn() };
    roles = { findOne: jest.fn() };
    rolePermissions = { find: jest.fn().mockResolvedValue([]) };
    repository = new TypeOrmPermissionRepository(
      members as unknown as Repository<Member>,
      roles as unknown as Repository<Role>,
      rolePermissions as unknown as Repository<RolePermission>,
    );
  });

  it('returns null when the user has no Member in the gym', async () => {
    members.findOne.mockResolvedValue(null);

    await expect(repository.findMemberRole('user-1', 'gym-1')).resolves.toBeNull();
  });

  it('returns null when the member references a role that no longer exists', async () => {
    members.findOne.mockResolvedValue({ roleId: 'role-1' });
    roles.findOne.mockResolvedValue(null);

    await expect(repository.findMemberRole('user-1', 'gym-1')).resolves.toBeNull();
  });

  it('returns the catalog role assigned to the member', async () => {
    members.findOne.mockResolvedValue({ roleId: 'role-1' });
    roles.findOne.mockResolvedValue({
      id: 'role-1',
      key: 'admin',
      name: 'Administrador',
      hierarchyLevel: HierarchyLevel.GYM,
    });

    await expect(repository.findMemberRole('user-1', 'gym-1')).resolves.toEqual({
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
