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
 * iniciales (`owner`/`admin`/`receptionist`/`instructor`) con sus
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
    const allExceptOrgDelete = ALL_PERMISSIONS.filter((code) => code !== PERMISSIONS.ORGANIZATION_DELETE);

    return [
      { key: 'owner', name: 'Dueño', hierarchyLevel: HierarchyLevel.ORGANIZATION, permissions: ALL_PERMISSIONS },
      {
        key: 'admin',
        name: 'Administrador',
        hierarchyLevel: HierarchyLevel.ORGANIZATION,
        permissions: allExceptOrgDelete,
      },
      {
        key: 'receptionist',
        name: 'Recepcionista',
        hierarchyLevel: HierarchyLevel.ORGANIZATION,
        permissions: [
          PERMISSIONS.ORGANIZATION_READ,
          PERMISSIONS.MEMBERS_READ,
          PERMISSIONS.MEMBERS_INVITE,
          PERMISSIONS.RESOURCES_READ,
          PERMISSIONS.RESOURCES_CREATE,
          PERMISSIONS.RESOURCES_UPDATE,
          PERMISSIONS.RESOURCES_DELETE,
          PERMISSIONS.SETTINGS_READ,
          PERMISSIONS.ROLES_READ,
          PERMISSIONS.USERS_READ,
        ],
      },
      {
        key: 'instructor',
        name: 'Instructor',
        hierarchyLevel: HierarchyLevel.SELF,
        permissions: [
          PERMISSIONS.ORGANIZATION_READ,
          PERMISSIONS.MEMBERS_READ,
          PERMISSIONS.RESOURCES_READ,
          PERMISSIONS.RESOURCES_CREATE,
          PERMISSIONS.RESOURCES_UPDATE,
          PERMISSIONS.SETTINGS_READ,
        ],
      },
    ];
  }

  private permissionDefinitions(): Record<PermissionKey, { name: string; description: string }> {
    return {
      'organization:read': { name: 'Read organization', description: 'Read organization details' },
      'organization:update': { name: 'Update organization', description: 'Update organization details' },
      'organization:delete': { name: 'Delete organization', description: 'Delete an organization' },
      'members:read': { name: 'Read members', description: 'Read organization members and invitations' },
      'members:invite': { name: 'Invite members', description: 'Invite and revoke invitations' },
      'members:update_role': { name: 'Update member roles', description: 'Change member roles' },
      'members:remove': { name: 'Remove members', description: 'Remove organization members' },
      'roles:read': { name: 'Read roles', description: 'Read the role catalog' },
      'users:read': { name: 'Read users', description: 'Read user profiles' },
      'resources:read': { name: 'Read resources', description: 'Read organization resources' },
      'resources:create': { name: 'Create resources', description: 'Create organization resources' },
      'resources:update': { name: 'Update resources', description: 'Update organization resources' },
      'resources:delete': { name: 'Delete resources', description: 'Delete organization resources' },
      'settings:read': { name: 'Read settings', description: 'Read organization settings' },
      'settings:update': { name: 'Update settings', description: 'Update organization settings' },
    };
  }
}
