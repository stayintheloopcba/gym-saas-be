import { HierarchyLevel } from '../../../common/enums/hierarchy-level.enum';
import { PERMISSIONS } from '../domain/permission-key';
import { PermissionDeniedError } from '../domain/permission.errors';
import { MemberRoleInfo, PermissionRepository } from '../domain/permission.repository';
import { GymPermissionService } from './gym-permission.service';

const roleInfo = (overrides: Partial<MemberRoleInfo> = {}): MemberRoleInfo => ({
  roleId: 'role-1',
  roleKey: 'admin',
  roleName: 'Administrador',
  hierarchyLevel: HierarchyLevel.GYM,
  ...overrides,
});

describe('GymPermissionService', () => {
  let repository: jest.Mocked<PermissionRepository>;
  let service: GymPermissionService;

  beforeEach(() => {
    repository = {
      findMemberRole: jest.fn(),
      findPermissionCodes: jest.fn().mockResolvedValue([]),
      findRoleSummary: jest.fn(),
    };
    service = new GymPermissionService(repository);
  });

  it('grants a permission the role has in role_permissions', async () => {
    repository.findMemberRole.mockResolvedValue(roleInfo());
    repository.findPermissionCodes.mockResolvedValue([PERMISSIONS.MEMBERS_REMOVE]);

    await expect(service.checkPermission('user-1', 'gym-1', PERMISSIONS.MEMBERS_REMOVE)).resolves.toBe(true);
  });

  it('denies a permission absent from role_permissions', async () => {
    repository.findMemberRole.mockResolvedValue(roleInfo());
    repository.findPermissionCodes.mockResolvedValue([]);

    await expect(service.checkPermission('user-1', 'gym-1', PERMISSIONS.SETTINGS_UPDATE)).resolves.toBe(false);
  });

  it('denies users without an active Member', async () => {
    repository.findMemberRole.mockResolvedValue(null);

    await expect(service.requirePermission('user-1', 'gym-1', PERMISSIONS.GYM_READ)).rejects.toBeInstanceOf(
      PermissionDeniedError,
    );
    expect(repository.findPermissionCodes).not.toHaveBeenCalled();
  });

  it('supports OR logic for multiple permissions', async () => {
    repository.findMemberRole.mockResolvedValue(roleInfo());
    repository.findPermissionCodes.mockResolvedValue([PERMISSIONS.GYM_READ]);

    await expect(
      service.checkPermission('user-1', 'gym-1', [PERMISSIONS.GYM_UPDATE, PERMISSIONS.GYM_READ]),
    ).resolves.toBe(true);
  });

  describe('getEffectivePermissions', () => {
    it('returns null for a user without an active Member', async () => {
      repository.findMemberRole.mockResolvedValue(null);

      await expect(service.getEffectivePermissions('user-1', 'gym-1')).resolves.toBeNull();
      expect(repository.findPermissionCodes).not.toHaveBeenCalled();
    });

    it('returns exactly the permission codes granted by the role', async () => {
      repository.findMemberRole.mockResolvedValue(
        roleInfo({ roleId: 'role-viewer', roleKey: 'receptionist', roleName: 'Recepcionista' }),
      );
      repository.findPermissionCodes.mockResolvedValue([PERMISSIONS.GYM_READ, PERMISSIONS.MEMBERS_READ]);

      const effective = await service.getEffectivePermissions('user-1', 'gym-1');

      expect(effective).toEqual({
        role: { id: 'role-viewer', key: 'receptionist', name: 'Recepcionista' },
        hierarchyLevel: HierarchyLevel.GYM,
        permissions: [PERMISSIONS.GYM_READ, PERMISSIONS.MEMBERS_READ],
      });
    });
  });
});
