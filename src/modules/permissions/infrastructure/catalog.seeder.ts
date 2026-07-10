import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { HierarchyLevel } from '../../../common/enums/hierarchy-level.enum';
import { Permission } from '../domain/permission.entity';
import { PERMISSIONS, PermissionKey } from '../domain/permission-key';
import { RolePermission } from '../domain/role-permission.entity';
import { Role } from '../domain/role.entity';

interface RoleSeed {
  key: string;
  name: string;
  hierarchyLevel: HierarchyLevel;
  permissions: readonly PermissionKey[];
}

const ALL_PERMISSIONS: readonly PermissionKey[] = Object.values(PERMISSIONS);

/**
 * Siembra el catálogo global al bootstrap: los códigos de permiso y los roles
 * iniciales (`owner`/`admin`/`receptionist`/`instructor`/`student`) con sus
 * `role_permissions`. Todo idempotente por clave natural (`code` / `key`):
 * un rol ya existente (y sus permisos) se deja intacto, así las ediciones de
 * un platform admin sobreviven a un reinicio.
 */
@Injectable()
export class CatalogSeeder implements OnApplicationBootstrap {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await this.ensurePermissions(manager);
      for (const seed of this.roleSeeds()) {
        await this.ensureRole(manager, seed);
      }
    });
  }

  private async ensurePermissions(manager: EntityManager): Promise<void> {
    const repository = manager.getRepository(Permission);
    const definitions = this.permissionDefinitions();

    for (const code of Object.keys(definitions) as PermissionKey[]) {
      const existing = await repository.findOne({ where: { code } });
      if (!existing) {
        await repository.save(
          repository.create({
            code,
            name: definitions[code].name,
            description: definitions[code].description,
            isActive: true,
          }),
        );
      }
    }
  }

  /** Crea el rol y sus `role_permissions` solo si el `key` no existe; nunca toca un rol ya sembrado. */
  private async ensureRole(manager: EntityManager, seed: RoleSeed): Promise<void> {
    const roles = manager.getRepository(Role);
    const existing = await roles.findOne({ where: { key: seed.key } });
    if (existing) {
      return;
    }

    const role = await roles.save(
      roles.create({ key: seed.key, name: seed.name, hierarchyLevel: seed.hierarchyLevel }),
    );

    const rolePermissions = manager.getRepository(RolePermission);
    for (const code of seed.permissions) {
      await rolePermissions.save(rolePermissions.create({ roleId: role.id, permissionCode: code }));
    }
  }

  private roleSeeds(): RoleSeed[] {
    const allExceptGymDelete = ALL_PERMISSIONS.filter((code) => code !== PERMISSIONS.GYM_DELETE);

    const readAll = [
      PERMISSIONS.GYM_READ,
      PERMISSIONS.SETTINGS_READ,
      PERMISSIONS.BRANCHES_READ,
      PERMISSIONS.PLANS_READ,
      PERMISSIONS.ROLES_READ,
      PERMISSIONS.USERS_READ,
    ];

    return [
      { key: 'owner', name: 'Dueño', hierarchyLevel: HierarchyLevel.GYM, permissions: ALL_PERMISSIONS },
      {
        key: 'admin',
        name: 'Administrador',
        hierarchyLevel: HierarchyLevel.GYM,
        permissions: allExceptGymDelete,
      },
      {
        key: 'receptionist',
        name: 'Recepcionista',
        hierarchyLevel: HierarchyLevel.GYM,
        permissions: [
          ...readAll,
          PERMISSIONS.MEMBERS_READ,
          PERMISSIONS.MEMBERS_CREATE,
          PERMISSIONS.MEMBERS_UPDATE,
          PERMISSIONS.SUBSCRIPTIONS_READ,
          PERMISSIONS.SUBSCRIPTIONS_MANAGE,
          PERMISSIONS.PAYMENTS_READ,
          PERMISSIONS.PAYMENTS_RECORD,
          PERMISSIONS.ACCESS_READ,
          PERMISSIONS.ACCESS_CHECKIN,
        ],
      },
      {
        key: 'instructor',
        name: 'Instructor',
        hierarchyLevel: HierarchyLevel.SELF,
        permissions: [
          ...readAll,
          PERMISSIONS.MEMBERS_READ,
          PERMISSIONS.ROUTINES_READ,
          PERMISSIONS.ROUTINES_MANAGE,
          PERMISSIONS.ROUTINES_ASSIGN,
          PERMISSIONS.PROGRESS_READ,
          PERMISSIONS.PROGRESS_RECORD,
        ],
      },
      {
        key: 'student',
        name: 'Alumno',
        hierarchyLevel: HierarchyLevel.SELF,
        permissions: [
          ...readAll,
          PERMISSIONS.MEMBERS_READ,
          PERMISSIONS.SUBSCRIPTIONS_READ,
          PERMISSIONS.PAYMENTS_READ,
          PERMISSIONS.ACCESS_READ,
          PERMISSIONS.ROUTINES_READ,
          PERMISSIONS.ROUTINES_MANAGE,
          PERMISSIONS.ROUTINES_ASSIGN,
          PERMISSIONS.PROGRESS_READ,
          PERMISSIONS.PROGRESS_RECORD,
        ],
      },
    ];
  }

  private permissionDefinitions(): Record<PermissionKey, { name: string; description: string }> {
    return {
      'gym:read': { name: 'Read gym', description: 'Read gym details' },
      'gym:update': { name: 'Update gym', description: 'Update gym details' },
      'gym:delete': { name: 'Delete gym', description: 'Delete a gym' },
      'members:read': { name: 'Read members', description: 'Read gym members' },
      'members:create': { name: 'Create members', description: 'Register new gym members' },
      'members:update': { name: 'Update members', description: "Update a member's personal data" },
      'members:update_role': { name: 'Update member roles', description: 'Change member roles' },
      'members:remove': { name: 'Remove members', description: 'Remove gym members' },
      'roles:read': { name: 'Read roles', description: 'Read the role catalog' },
      'users:read': { name: 'Read users', description: 'Read user profiles' },
      'settings:read': { name: 'Read settings', description: 'Read gym settings' },
      'settings:update': { name: 'Update settings', description: 'Update gym settings' },
      'branches:read': { name: 'Read branches', description: 'Read gym branches' },
      'branches:manage': { name: 'Manage branches', description: 'Create, update and remove branches' },
      'plans:read': { name: 'Read plans', description: 'Read membership plans' },
      'plans:manage': { name: 'Manage plans', description: 'Create, update and remove membership plans' },
      'subscriptions:read': { name: 'Read subscriptions', description: 'Read member subscriptions' },
      'subscriptions:manage': {
        name: 'Manage subscriptions',
        description: 'Create and update member subscriptions',
      },
      'payments:read': { name: 'Read payments', description: 'Read recorded payments' },
      'payments:record': { name: 'Record payments', description: 'Record a payment for a subscription' },
      'payments:void': { name: 'Void payments', description: 'Void a recorded payment' },
      'access:read': { name: 'Read access logs', description: 'Read check-in/access history' },
      'access:checkin': { name: 'Check in members', description: 'Record a manual member check-in' },
      'routines:read': { name: 'Read routines', description: 'Read routine templates and assignments' },
      'routines:manage': { name: 'Manage routines', description: 'Create, update and remove routines' },
      'routines:assign': { name: 'Assign routines', description: 'Assign or unassign a routine to a member' },
      'progress:read': { name: 'Read progress', description: "Read a member's training progress" },
      'progress:record': { name: 'Record progress', description: 'Record training progress entries' },
    };
  }
}
