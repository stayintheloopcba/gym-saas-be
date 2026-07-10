import { DataSource } from 'typeorm';
import { HierarchyLevel } from '../../../common/enums/hierarchy-level.enum';
import { Permission } from '../domain/permission.entity';
import { PERMISSIONS } from '../domain/permission-key';
import { RolePermission } from '../domain/role-permission.entity';
import { Role } from '../domain/role.entity';
import { CatalogSeeder } from './catalog.seeder';

describe('CatalogSeeder', () => {
  const build = (existing: boolean) => {
    const permissionRepository = {
      findOne: jest.fn(({ where }) =>
        Promise.resolve(existing ? { id: `permission-${where.code}`, code: where.code } : null),
      ),
      create: jest.fn((value) => ({ ...value })),
      save: jest.fn((value) => Promise.resolve({ id: `permission-${value.code}`, ...value })),
    };
    const roleRepository = {
      findOne: jest.fn(({ where }) => Promise.resolve(existing ? { id: `role-${where.key}`, key: where.key } : null)),
      create: jest.fn((value) => ({ ...value })),
      save: jest.fn((value) => Promise.resolve({ id: `role-${value.key}`, ...value })),
    };
    const rolePermissionRepository = {
      create: jest.fn((value) => ({ ...value })),
      save: jest.fn((value) => Promise.resolve(value)),
    };
    const manager = {
      getRepository: jest.fn((entity) => {
        if (entity === Permission) return permissionRepository;
        if (entity === Role) return roleRepository;
        if (entity === RolePermission) return rolePermissionRepository;
        throw new Error('Unexpected entity');
      }),
    };
    const dataSource = { transaction: jest.fn((callback) => callback(manager)) };

    return {
      seeder: new CatalogSeeder(dataSource as unknown as DataSource),
      permissionRepository,
      roleRepository,
      rolePermissionRepository,
      manager,
    };
  };

  it('creates the permission catalog and the initial roles with their permission rows', async () => {
    const { seeder, permissionRepository, roleRepository, rolePermissionRepository } = build(false);

    await seeder.onApplicationBootstrap();

    expect(permissionRepository.save).toHaveBeenCalledTimes(Object.keys(PERMISSIONS).length);
    expect(roleRepository.save).toHaveBeenCalledTimes(5);
    // owner gets every permission in the catalog.
    expect(rolePermissionRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ roleId: 'role-owner', permissionCode: PERMISSIONS.GYM_DELETE }),
    );
    // student is seeded with SELF hierarchy and granted its self-scoped permissions.
    expect(roleRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'student', hierarchyLevel: HierarchyLevel.SELF }),
    );
    expect(rolePermissionRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ roleId: 'role-student', permissionCode: PERMISSIONS.PROGRESS_RECORD }),
    );
  });

  it('is idempotent when catalog rows and roles already exist (preserves admin edits)', async () => {
    const { seeder, permissionRepository, roleRepository, rolePermissionRepository } = build(true);

    await seeder.onApplicationBootstrap();

    expect(permissionRepository.create).not.toHaveBeenCalled();
    expect(roleRepository.create).not.toHaveBeenCalled();
    expect(rolePermissionRepository.save).not.toHaveBeenCalled();
  });
});
