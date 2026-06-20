import { HierarchyLevel } from '../../../common/enums/hierarchy-level.enum';
import { MembershipRole } from '../../../common/enums/membership-role.enum';
import { PermissionDeniedError } from '../domain/permission.errors';
import { PERMISSIONS } from '../domain/permission-key';
import { PermissionGrant, PermissionRepository } from '../domain/permission.repository';
import { OrganizationPermissionService } from './organization-permission.service';

const grant = (
  permissionCode: string,
  value: boolean,
  precedence: number,
  level: 'user' | 'role',
): PermissionGrant => ({ permissionCode, value, precedence, level });

describe('OrganizationPermissionService', () => {
  let repository: jest.Mocked<PermissionRepository>;
  let service: OrganizationPermissionService;

  beforeEach(() => {
    repository = {
      findAssignment: jest.fn(),
      findGrants: jest.fn().mockResolvedValue([]),
      findRoleHierarchyLevel: jest.fn().mockResolvedValue(null),
    };
    service = new OrganizationPermissionService(repository);
  });

  it('grants a permission from the system role baseline (no overrides)', async () => {
    repository.findAssignment.mockResolvedValue({ membershipRole: MembershipRole.ADMIN });

    // ADMIN baseline incluye members:invite; sin grants persistidos.
    await expect(service.checkPermission('user-1', 'org-1', PERMISSIONS.MEMBERS_INVITE)).resolves.toBe(true);
  });

  it('denies a permission absent from baseline and grants', async () => {
    repository.findAssignment.mockResolvedValue({ membershipRole: MembershipRole.MEMBER });

    // MEMBER no tiene resources:delete en el baseline y no hay grants.
    await expect(service.checkPermission('user-1', 'org-1', PERMISSIONS.RESOURCES_DELETE)).resolves.toBe(false);
  });

  it('denies users without an active membership', async () => {
    repository.findAssignment.mockResolvedValue(null);

    await expect(service.requirePermission('user-1', 'org-1', PERMISSIONS.ORGANIZATION_READ)).rejects.toBeInstanceOf(
      PermissionDeniedError,
    );
    expect(repository.findGrants).not.toHaveBeenCalled();
  });

  it('lets a user-level grant add a permission the role lacks', async () => {
    repository.findAssignment.mockResolvedValue({ membershipRole: MembershipRole.MEMBER });
    repository.findGrants.mockResolvedValue([grant(PERMISSIONS.MEMBERS_INVITE, true, 5, 'user')]);

    await expect(service.checkPermission('user-1', 'org-1', PERMISSIONS.MEMBERS_INVITE)).resolves.toBe(true);
  });

  it('lets a user-level deny override a role allow', async () => {
    // ADMIN baseline incluye resources:delete (allow, precedence 0).
    repository.findAssignment.mockResolvedValue({ membershipRole: MembershipRole.ADMIN });
    repository.findGrants.mockResolvedValue([grant(PERMISSIONS.RESOURCES_DELETE, false, 5, 'user')]);

    await expect(service.checkPermission('user-1', 'org-1', PERMISSIONS.RESOURCES_DELETE)).resolves.toBe(false);
  });

  it('applies a role-level deny over the baseline allow', async () => {
    // MEMBER baseline incluye resources:read (allow, precedence 0); rol custom lo deniega.
    repository.findAssignment.mockResolvedValue({ membershipRole: MembershipRole.MEMBER, customRoleId: 'role-1' });
    repository.findGrants.mockResolvedValue([grant(PERMISSIONS.RESOURCES_READ, false, 5, 'role')]);

    await expect(service.checkPermission('user-1', 'org-1', PERMISSIONS.RESOURCES_READ)).resolves.toBe(false);
  });

  it('picks the assignment with the highest precedence', async () => {
    repository.findAssignment.mockResolvedValue({ membershipRole: MembershipRole.MEMBER, customRoleId: 'role-1' });
    repository.findGrants.mockResolvedValue([
      grant(PERMISSIONS.RESOURCES_DELETE, true, 5, 'role'),
      grant(PERMISSIONS.RESOURCES_DELETE, false, 10, 'user'),
    ]);

    await expect(service.checkPermission('user-1', 'org-1', PERMISSIONS.RESOURCES_DELETE)).resolves.toBe(false);
  });

  it('breaks a precedence tie in favor of the user level', async () => {
    repository.findAssignment.mockResolvedValue({ membershipRole: MembershipRole.MEMBER, customRoleId: 'role-1' });
    repository.findGrants.mockResolvedValue([
      grant(PERMISSIONS.RESOURCES_DELETE, true, 5, 'role'),
      grant(PERMISSIONS.RESOURCES_DELETE, false, 5, 'user'),
    ]);

    await expect(service.checkPermission('user-1', 'org-1', PERMISSIONS.RESOURCES_DELETE)).resolves.toBe(false);
  });

  it('breaks a full tie in favor of deny (fail-safe)', async () => {
    repository.findAssignment.mockResolvedValue({ membershipRole: MembershipRole.MEMBER, customRoleId: 'role-1' });
    repository.findGrants.mockResolvedValue([
      grant(PERMISSIONS.RESOURCES_DELETE, true, 5, 'role'),
      grant(PERMISSIONS.RESOURCES_DELETE, false, 5, 'role'),
    ]);

    await expect(service.checkPermission('user-1', 'org-1', PERMISSIONS.RESOURCES_DELETE)).resolves.toBe(false);
  });

  it('supports OR logic for multiple permissions', async () => {
    repository.findAssignment.mockResolvedValue({ membershipRole: MembershipRole.VIEWER });

    // VIEWER baseline tiene organization:read pero no organization:update.
    await expect(
      service.checkPermission('user-1', 'org-1', [PERMISSIONS.ORGANIZATION_UPDATE, PERMISSIONS.ORGANIZATION_READ]),
    ).resolves.toBe(true);
  });

  describe('getEffectivePermissions', () => {
    it('returns null for a user without an active membership', async () => {
      repository.findAssignment.mockResolvedValue(null);

      await expect(service.getEffectivePermissions('user-1', 'org-1')).resolves.toBeNull();
      expect(repository.findGrants).not.toHaveBeenCalled();
    });

    it('returns the system role baseline when there are no grants', async () => {
      repository.findAssignment.mockResolvedValue({ membershipRole: MembershipRole.VIEWER });

      const effective = await service.getEffectivePermissions('user-1', 'org-1');

      expect(effective).toEqual({
        role: MembershipRole.VIEWER,
        customRoleId: null,
        hierarchyLevel: HierarchyLevel.ORGANIZATION,
        permissions: expect.arrayContaining([PERMISSIONS.ORGANIZATION_READ, PERMISSIONS.RESOURCES_READ]),
      });
      // VIEWER no puede borrar recursos ni gestionar la organización.
      expect(effective?.permissions).not.toContain(PERMISSIONS.RESOURCES_DELETE);
      expect(effective?.permissions).not.toContain(PERMISSIONS.ORGANIZATION_UPDATE);
    });

    it('adds user-level grants and removes denied permissions', async () => {
      repository.findAssignment.mockResolvedValue({ membershipRole: MembershipRole.MEMBER, customRoleId: 'role-1' });
      repository.findGrants.mockResolvedValue([
        grant(PERMISSIONS.MEMBERS_INVITE, true, 10, 'user'), // agrega un permiso fuera del baseline
        grant(PERMISSIONS.RESOURCES_READ, false, 5, 'role'), // deniega uno del baseline
      ]);

      const effective = await service.getEffectivePermissions('user-1', 'org-1');

      expect(effective?.customRoleId).toBe('role-1');
      expect(effective?.permissions).toContain(PERMISSIONS.MEMBERS_INVITE);
      expect(effective?.permissions).not.toContain(PERMISSIONS.RESOURCES_READ);
    });
  });
});
