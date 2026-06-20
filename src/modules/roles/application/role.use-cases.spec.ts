import { HierarchyLevel } from '../../../common/enums/hierarchy-level.enum';
import { OrganizationPermissionService } from '../../permissions/application/organization-permission.service';
import { OwnershipContextService } from '../../permissions/application/ownership-context.service';
import { PermissionDeniedError } from '../../permissions/domain/permission.errors';
import { Role } from '../../permissions/domain/role.entity';
import { MembershipRepository } from '../../memberships/domain/membership.repository';
import {
  RoleHierarchyExceededError,
  RoleInUseError,
  RoleNameConflictError,
  RoleNotFoundError,
  SystemRoleImmutableError,
} from '../domain/role.errors';
import { RoleRepository } from '../domain/role.repository';
import { CreateRoleUseCase } from './create-role.use-case';
import { DeleteRoleUseCase } from './delete-role.use-case';
import { UpdateRoleUseCase } from './update-role.use-case';

const ORG = 'org-1';
const CALLER = 'user-1';

const customRole = (over: Partial<Role> = {}): Role =>
  Object.assign(new Role(), {
    id: 'role-1',
    organizationId: ORG,
    name: 'Editor',
    isSystem: false,
    systemKey: null,
    hierarchyLevel: HierarchyLevel.SELF,
    ...over,
  });

describe('Role use cases', () => {
  let roles: jest.Mocked<RoleRepository>;
  let permissions: { requirePermission: jest.Mock };
  let ownership: { build: jest.Mock };
  let memberships: { countByRole: jest.Mock };

  beforeEach(() => {
    roles = {
      findById: jest.fn(),
      findActiveByName: jest.fn().mockResolvedValue(null),
      listForOrganization: jest.fn(),
      save: jest.fn((role) => Promise.resolve(role)),
      softDelete: jest.fn(),
    };
    permissions = { requirePermission: jest.fn() };
    ownership = { build: jest.fn().mockResolvedValue({ userId: CALLER, organizationId: ORG, hierarchyLevel: 5 }) };
    memberships = { countByRole: jest.fn().mockResolvedValue(0) };
  });

  const createUseCase = () =>
    new CreateRoleUseCase(
      roles,
      permissions as unknown as OrganizationPermissionService,
      ownership as unknown as OwnershipContextService,
    );

  it('creates a custom role within the caller hierarchy', async () => {
    const role = await createUseCase().execute({
      callerUserId: CALLER,
      organizationId: ORG,
      name: 'Editor',
      hierarchyLevel: HierarchyLevel.SELF,
    });

    expect(role.isSystem).toBe(false);
    expect(role.organizationId).toBe(ORG);
    expect(roles.save).toHaveBeenCalled();
  });

  it('rejects a duplicate role name', async () => {
    roles.findActiveByName.mockResolvedValue(customRole());

    await expect(
      createUseCase().execute({
        callerUserId: CALLER,
        organizationId: ORG,
        name: 'Editor',
        hierarchyLevel: HierarchyLevel.SELF,
      }),
    ).rejects.toBeInstanceOf(RoleNameConflictError);
  });

  it('rejects creating a role above the caller hierarchy', async () => {
    ownership.build.mockResolvedValue({ userId: CALLER, organizationId: ORG, hierarchyLevel: HierarchyLevel.SELF });

    await expect(
      createUseCase().execute({
        callerUserId: CALLER,
        organizationId: ORG,
        name: 'Admin-ish',
        hierarchyLevel: HierarchyLevel.ORGANIZATION,
      }),
    ).rejects.toBeInstanceOf(RoleHierarchyExceededError);
  });

  it('propagates a permission denial on create', async () => {
    permissions.requirePermission.mockRejectedValue(new PermissionDeniedError());

    await expect(
      createUseCase().execute({
        callerUserId: CALLER,
        organizationId: ORG,
        name: 'Editor',
        hierarchyLevel: HierarchyLevel.SELF,
      }),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
  });

  const updateUseCase = () =>
    new UpdateRoleUseCase(
      roles,
      permissions as unknown as OrganizationPermissionService,
      ownership as unknown as OwnershipContextService,
    );

  it('refuses to update a system role', async () => {
    roles.findById.mockResolvedValue(customRole({ isSystem: true, organizationId: null }));

    await expect(
      updateUseCase().execute({ callerUserId: CALLER, organizationId: ORG, roleId: 'role-1', name: 'x' }),
    ).rejects.toBeInstanceOf(SystemRoleImmutableError);
  });

  it('treats a role from another organization as not found', async () => {
    roles.findById.mockResolvedValue(customRole({ organizationId: 'other-org' }));

    await expect(
      updateUseCase().execute({ callerUserId: CALLER, organizationId: ORG, roleId: 'role-1', name: 'x' }),
    ).rejects.toBeInstanceOf(RoleNotFoundError);
  });

  const deleteUseCase = () =>
    new DeleteRoleUseCase(
      roles,
      memberships as unknown as MembershipRepository,
      permissions as unknown as OrganizationPermissionService,
    );

  it('refuses to delete a role in use', async () => {
    roles.findById.mockResolvedValue(customRole());
    memberships.countByRole.mockResolvedValue(2);

    await expect(deleteUseCase().execute(CALLER, ORG, 'role-1')).rejects.toBeInstanceOf(RoleInUseError);
    expect(roles.softDelete).not.toHaveBeenCalled();
  });

  it('deletes a custom role that is not in use', async () => {
    roles.findById.mockResolvedValue(customRole());
    memberships.countByRole.mockResolvedValue(0);

    await deleteUseCase().execute(CALLER, ORG, 'role-1');

    expect(roles.softDelete).toHaveBeenCalledWith('role-1');
  });

  it('refuses to delete a system role', async () => {
    roles.findById.mockResolvedValue(customRole({ isSystem: true, organizationId: null }));

    await expect(deleteUseCase().execute(CALLER, ORG, 'role-1')).rejects.toBeInstanceOf(SystemRoleImmutableError);
  });
});
