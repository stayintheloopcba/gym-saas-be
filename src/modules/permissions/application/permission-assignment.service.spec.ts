import { PermissionDeniedError, UnknownPermissionError } from '../domain/permission.errors';
import { PermissionAssignmentRepository } from '../domain/permission-assignment.repository';
import { PermissionCatalogRepository } from '../domain/permission-catalog.repository';
import { OrganizationPermissionService } from './organization-permission.service';
import { PermissionAssignmentService } from './permission-assignment.service';

const ORG = 'org-1';
const CALLER = 'user-1';

describe('PermissionAssignmentService', () => {
  let assignments: jest.Mocked<PermissionAssignmentRepository>;
  let catalog: jest.Mocked<PermissionCatalogRepository>;
  let permissions: { requirePermission: jest.Mock };
  let service: PermissionAssignmentService;

  beforeEach(() => {
    assignments = {
      upsert: jest.fn(),
      remove: jest.fn(),
      listRoleAssignments: jest.fn(),
    };
    catalog = {
      listActive: jest.fn(),
      existsActive: jest.fn().mockResolvedValue(true),
    };
    permissions = { requirePermission: jest.fn() };
    service = new PermissionAssignmentService(
      assignments,
      catalog,
      permissions as unknown as OrganizationPermissionService,
    );
  });

  it('assigns a permission to a role with role precedence', async () => {
    await service.assignToRole(CALLER, ORG, 'role-1', { permissionCode: 'resources:create', value: true });

    expect(assignments.upsert).toHaveBeenCalledWith(
      { organizationId: ORG, roleId: 'role-1' },
      'resources:create',
      true,
      5,
    );
  });

  it('assigns an override to a user with user precedence (higher than role)', async () => {
    await service.assignToUser(CALLER, ORG, 'target-user', { permissionCode: 'members:invite', value: true });

    expect(assignments.upsert).toHaveBeenCalledWith(
      { organizationId: ORG, userId: 'target-user' },
      'members:invite',
      true,
      10,
    );
  });

  it('persists a deny override', async () => {
    await service.assignToUser(CALLER, ORG, 'target-user', { permissionCode: 'resources:delete', value: false });

    expect(assignments.upsert).toHaveBeenCalledWith(
      { organizationId: ORG, userId: 'target-user' },
      'resources:delete',
      false,
      10,
    );
  });

  it('bulk-assigns without duplicating (delegates each upsert)', async () => {
    await service.bulkAssignToRole(CALLER, ORG, 'role-1', [
      { permissionCode: 'resources:read', value: true },
      { permissionCode: 'resources:update', value: true },
    ]);

    expect(assignments.upsert).toHaveBeenCalledTimes(2);
  });

  it('rejects an unknown permission code', async () => {
    catalog.existsActive.mockResolvedValue(false);

    await expect(
      service.assignToRole(CALLER, ORG, 'role-1', { permissionCode: 'nope:nope', value: true }),
    ).rejects.toBeInstanceOf(UnknownPermissionError);
    expect(assignments.upsert).not.toHaveBeenCalled();
  });

  it('requires the manage permission', async () => {
    permissions.requirePermission.mockRejectedValue(new PermissionDeniedError());

    await expect(
      service.assignToRole(CALLER, ORG, 'role-1', { permissionCode: 'resources:create', value: true }),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
    expect(assignments.upsert).not.toHaveBeenCalled();
  });

  it('removes a user override', async () => {
    await service.unassignFromUser(CALLER, ORG, 'target-user', 'members:invite');

    expect(assignments.remove).toHaveBeenCalledWith({ organizationId: ORG, userId: 'target-user' }, 'members:invite');
  });
});
