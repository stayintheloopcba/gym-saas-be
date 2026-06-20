import { MembershipRole } from '../../../common/enums/membership-role.enum';
import { Permission } from '../domain/permission.entity';
import { PermissionDeniedError } from '../domain/permission.errors';
import { PermissionAssignmentRepository } from '../domain/permission-assignment.repository';
import { PermissionCatalogRepository } from '../domain/permission-catalog.repository';
import { Role } from '../domain/role.entity';
import { OrganizationPermissionService } from './organization-permission.service';
import { PermissionsMatrixService } from './permissions-matrix.service';

const ORG = 'org-1';
const CALLER = 'user-1';

const permission = (code: string): Permission =>
  Object.assign(new Permission(), { code, name: code, description: code, isActive: true });

const systemRole = (id: string, systemKey: MembershipRole): Role =>
  Object.assign(new Role(), { id, isSystem: true, systemKey, organizationId: null, name: systemKey });

const customRole = (id: string): Role =>
  Object.assign(new Role(), { id, isSystem: false, systemKey: null, organizationId: ORG, name: 'Editor' });

describe('PermissionsMatrixService', () => {
  let assignments: jest.Mocked<PermissionAssignmentRepository>;
  let catalog: jest.Mocked<PermissionCatalogRepository>;
  let permissions: { checkPermission: jest.Mock };
  let service: PermissionsMatrixService;

  beforeEach(() => {
    assignments = {
      upsert: jest.fn(),
      remove: jest.fn(),
      listRoleAssignments: jest.fn().mockResolvedValue([]),
    };
    catalog = {
      listActive: jest
        .fn()
        .mockResolvedValue([permission('resources:read'), permission('resources:update'), permission('members:read')]),
      existsActive: jest.fn(),
    };
    permissions = { checkPermission: jest.fn().mockResolvedValue(true) };
    service = new PermissionsMatrixService(
      assignments,
      catalog,
      permissions as unknown as OrganizationPermissionService,
    );
  });

  it('rejects callers without an admin read permission', async () => {
    permissions.checkPermission.mockResolvedValue(false);

    await expect(service.getMatrix(CALLER, ORG, [])).rejects.toBeInstanceOf(PermissionDeniedError);
  });

  it('derives system role assignments from the baseline', async () => {
    const viewer = systemRole('viewer-1', MembershipRole.VIEWER);

    const matrix = await service.getMatrix(CALLER, ORG, [viewer]);

    // VIEWER baseline incluye resources:read y members:read (no resources:update).
    const codes = matrix.assignments['viewer-1'].map((a) => a.permissionCode);
    expect(codes).toEqual(expect.arrayContaining(['resources:read', 'members:read']));
    expect(codes).not.toContain('resources:update');
  });

  it('uses persisted assignments for custom roles', async () => {
    const editor = customRole('editor-1');
    assignments.listRoleAssignments.mockResolvedValue([
      { roleId: 'editor-1', permissionCode: 'resources:update', value: true },
    ]);

    const matrix = await service.getMatrix(CALLER, ORG, [editor]);

    expect(matrix.assignments['editor-1']).toEqual([{ permissionCode: 'resources:update', value: true }]);
  });

  it('filters the matrix by resource prefix', async () => {
    const viewer = systemRole('viewer-1', MembershipRole.VIEWER);

    const matrix = await service.getMatrix(CALLER, ORG, [viewer], 'resources');

    expect(matrix.permissions.every((p) => p.code.startsWith('resources:'))).toBe(true);
    expect(matrix.assignments['viewer-1'].every((a) => a.permissionCode.startsWith('resources:'))).toBe(true);
  });
});
