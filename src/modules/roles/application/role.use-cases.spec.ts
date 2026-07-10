import { HierarchyLevel } from '../../../common/enums/hierarchy-level.enum';
import type { MembershipRepository } from '../../memberships/domain/membership.repository';
import type { PermissionCatalogRepository } from '../../permissions/domain/permission-catalog.repository';
import { UnknownPermissionError } from '../../permissions/domain/permission.errors';
import type { RolePermissionRepository } from '../../permissions/domain/role-permission.repository';
import { Role } from '../../permissions/domain/role.entity';
import {
  OwnerRoleProtectedError,
  RoleInUseError,
  RoleKeyConflictError,
  RoleNotFoundError,
} from '../domain/role.errors';
import type { RoleRepository } from '../domain/role.repository';
import { CreateRoleUseCase } from './create-role.use-case';
import { DeleteRoleUseCase } from './delete-role.use-case';
import { ReplaceRolePermissionsUseCase } from './replace-role-permissions.use-case';
import { UpdateRoleUseCase } from './update-role.use-case';

const role = (overrides: Partial<Role> = {}): Role =>
  Object.assign(new Role(), {
    id: 'role-1',
    key: 'billing-manager',
    name: 'Billing manager',
    hierarchyLevel: 5,
    ...overrides,
  });

describe('CreateRoleUseCase', () => {
  let roles: jest.Mocked<RoleRepository>;
  let useCase: CreateRoleUseCase;

  beforeEach(() => {
    roles = {
      findById: jest.fn(),
      findByKey: jest.fn(),
      listAll: jest.fn(),
      save: jest.fn((r: Role) => Promise.resolve(r)),
      softDelete: jest.fn(),
    };
    useCase = new CreateRoleUseCase(roles);
  });

  it('creates a role with a unique key', async () => {
    roles.findByKey.mockResolvedValue(null);

    const result = await useCase.execute({
      key: 'billing-manager',
      name: 'Billing manager',
      hierarchyLevel: HierarchyLevel.GYM,
    });

    expect(result.key).toBe('billing-manager');
    expect(roles.save).toHaveBeenCalled();
  });

  it('rejects a duplicate key', async () => {
    roles.findByKey.mockResolvedValue(role());

    await expect(
      useCase.execute({ key: 'billing-manager', name: 'Billing manager', hierarchyLevel: HierarchyLevel.SELF }),
    ).rejects.toBeInstanceOf(RoleKeyConflictError);
    expect(roles.save).not.toHaveBeenCalled();
  });
});

describe('UpdateRoleUseCase', () => {
  let roles: jest.Mocked<RoleRepository>;
  let useCase: UpdateRoleUseCase;

  beforeEach(() => {
    roles = {
      findById: jest.fn(),
      findByKey: jest.fn(),
      listAll: jest.fn(),
      save: jest.fn((r: Role) => Promise.resolve(r)),
      softDelete: jest.fn(),
    };
    useCase = new UpdateRoleUseCase(roles);
  });

  it('updates name, description and hierarchyLevel, never key', async () => {
    roles.findById.mockResolvedValue(role());

    const result = await useCase.execute({ roleId: 'role-1', name: 'New name', hierarchyLevel: HierarchyLevel.SELF });

    expect(result.name).toBe('New name');
    expect(result.hierarchyLevel).toBe(HierarchyLevel.SELF);
    expect(result.key).toBe('billing-manager');
  });

  it('rejects an unknown role', async () => {
    roles.findById.mockResolvedValue(null);

    await expect(useCase.execute({ roleId: 'ghost' })).rejects.toBeInstanceOf(RoleNotFoundError);
  });
});

describe('DeleteRoleUseCase', () => {
  let roles: jest.Mocked<RoleRepository>;
  let memberships: { countByRole: jest.Mock };
  let useCase: DeleteRoleUseCase;

  beforeEach(() => {
    roles = {
      findById: jest.fn(),
      findByKey: jest.fn(),
      listAll: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    };
    memberships = { countByRole: jest.fn().mockResolvedValue(0) };
    useCase = new DeleteRoleUseCase(roles, memberships as unknown as MembershipRepository);
  });

  it('deletes a role with no members', async () => {
    roles.findById.mockResolvedValue(role());

    await useCase.execute('role-1');

    expect(roles.softDelete).toHaveBeenCalledWith('role-1');
  });

  it('rejects deleting the owner role', async () => {
    roles.findById.mockResolvedValue(role({ key: 'owner' }));

    await expect(useCase.execute('role-1')).rejects.toBeInstanceOf(OwnerRoleProtectedError);
    expect(roles.softDelete).not.toHaveBeenCalled();
  });

  it('rejects deleting a role in use by a membership', async () => {
    roles.findById.mockResolvedValue(role());
    memberships.countByRole.mockResolvedValue(1);

    await expect(useCase.execute('role-1')).rejects.toBeInstanceOf(RoleInUseError);
  });
});

describe('ReplaceRolePermissionsUseCase', () => {
  let roles: jest.Mocked<RoleRepository>;
  let rolePermissions: { replacePermissions: jest.Mock };
  let catalog: { existsActive: jest.Mock };
  let useCase: ReplaceRolePermissionsUseCase;

  beforeEach(() => {
    roles = {
      findById: jest.fn(),
      findByKey: jest.fn(),
      listAll: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    };
    rolePermissions = { replacePermissions: jest.fn() };
    catalog = { existsActive: jest.fn().mockResolvedValue(true) };
    useCase = new ReplaceRolePermissionsUseCase(
      roles,
      rolePermissions as unknown as RolePermissionRepository,
      catalog as unknown as PermissionCatalogRepository,
    );
  });

  it('replaces the full permission set of a role', async () => {
    roles.findById.mockResolvedValue(role());

    await useCase.execute({ roleId: 'role-1', permissionCodes: ['members:read', 'members:invite'] });

    expect(rolePermissions.replacePermissions).toHaveBeenCalledWith('role-1', ['members:read', 'members:invite']);
  });

  it('rejects an unknown permission code', async () => {
    roles.findById.mockResolvedValue(role());
    catalog.existsActive.mockResolvedValue(false);

    await expect(useCase.execute({ roleId: 'role-1', permissionCodes: ['nonsense:code'] })).rejects.toBeInstanceOf(
      UnknownPermissionError,
    );
    expect(rolePermissions.replacePermissions).not.toHaveBeenCalled();
  });

  it('rejects an unknown role', async () => {
    roles.findById.mockResolvedValue(null);

    await expect(useCase.execute({ roleId: 'ghost', permissionCodes: [] })).rejects.toBeInstanceOf(RoleNotFoundError);
  });
});
