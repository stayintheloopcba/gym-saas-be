import { DataSource } from 'typeorm';
import { Membership } from '../../memberships/domain/membership.entity';
import { Permission } from '../domain/permission.entity';
import { PERMISSIONS } from '../domain/permission-key';
import { Role } from '../domain/role.entity';
import { PermissionCatalogSeeder } from './permission-catalog.seeder';

describe('PermissionCatalogSeeder', () => {
  const build = (existing: boolean) => {
    const permissionRepository = {
      findOne: jest.fn(({ where }) =>
        Promise.resolve(existing ? { id: `permission-${where.code}`, code: where.code } : null),
      ),
      create: jest.fn((value) => ({ ...value })),
      save: jest.fn((value) => Promise.resolve({ id: `permission-${value.code}`, ...value })),
    };
    const roleRepository = {
      findOne: jest.fn(({ where }) =>
        Promise.resolve(existing ? { id: `role-${where.systemKey}`, systemKey: where.systemKey } : null),
      ),
      create: jest.fn((value) => ({ ...value })),
      save: jest.fn((value) => Promise.resolve({ id: `role-${value.systemKey}`, ...value })),
    };
    const membershipRepository = {
      update: jest.fn().mockResolvedValue({ affected: 0 }),
    };
    const manager = {
      getRepository: jest.fn((entity) => {
        if (entity === Permission) return permissionRepository;
        if (entity === Role) return roleRepository;
        if (entity === Membership) return membershipRepository;
        throw new Error('Unexpected entity');
      }),
    };
    const dataSource = { transaction: jest.fn((callback) => callback(manager)) };

    return {
      seeder: new PermissionCatalogSeeder(dataSource as unknown as DataSource),
      permissionRepository,
      roleRepository,
      membershipRepository,
      manager,
    };
  };

  it('creates the permission catalog and system roles (baseline lives in memory)', async () => {
    const { seeder, permissionRepository, roleRepository } = build(false);

    await seeder.onApplicationBootstrap();

    expect(permissionRepository.save).toHaveBeenCalledTimes(Object.keys(PERMISSIONS).length);
    expect(roleRepository.save).toHaveBeenCalledTimes(4);
  });

  it('does not persist baseline assignments and clears legacy system role links', async () => {
    const { seeder, membershipRepository } = build(false);

    await seeder.onApplicationBootstrap();

    expect(membershipRepository.update).toHaveBeenCalledWith({ roleId: expect.anything() }, { roleId: null });
  });

  it('is idempotent when catalog rows and roles already exist', async () => {
    const { seeder, permissionRepository, roleRepository } = build(true);

    await seeder.onApplicationBootstrap();

    expect(permissionRepository.create).not.toHaveBeenCalled();
    expect(roleRepository.create).not.toHaveBeenCalled();
  });
});
