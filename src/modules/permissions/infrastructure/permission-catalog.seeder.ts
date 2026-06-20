import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, In } from 'typeorm';
import { SYSTEM_ROLE_HIERARCHY } from '../../../common/enums/hierarchy-level.enum';
import { MembershipRole } from '../../../common/enums/membership-role.enum';
import { Membership } from '../../memberships/domain/membership.entity';
import { Permission } from '../domain/permission.entity';
import { PermissionKey } from '../domain/permission-key';
import { Role } from '../domain/role.entity';

@Injectable()
export class PermissionCatalogSeeder implements OnApplicationBootstrap {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /**
   * Siembra el catálogo de permisos y los roles de sistema. El baseline de permisos
   * de cada rol de sistema NO se persiste: vive en `DEFAULT_ROLE_PERMISSIONS` (en
   * memoria) y lo aplica el motor de evaluación. La tabla `permission_assignments`
   * solo guarda overrides (roles custom + grants/denies de usuario).
   */
  async onApplicationBootstrap(): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await this.ensurePermissions(manager);
      const systemRoles: Role[] = [];
      for (const roleKey of Object.values(MembershipRole)) {
        systemRoles.push(await this.ensureSystemRole(manager, roleKey));
      }
      await this.clearLegacySystemRoleAssignments(manager, systemRoles);
    });
  }

  private async ensurePermissions(manager: EntityManager): Promise<void> {
    const repository = manager.getRepository(Permission);
    const definitions = this.permissionDefinitions();

    for (const code of Object.keys(definitions) as PermissionKey[]) {
      let permission = await repository.findOne({ where: { code } });
      if (!permission) {
        permission = repository.create({
          code,
          name: definitions[code].name,
          description: definitions[code].description,
          isActive: true,
        });
        permission = await repository.save(permission);
      }
    }
  }

  private async ensureSystemRole(manager: EntityManager, systemKey: MembershipRole): Promise<Role> {
    const repository = manager.getRepository(Role);
    const existing = await repository.findOne({ where: { systemKey } });
    if (existing) {
      return existing;
    }
    return repository.save(
      repository.create({
        organizationId: null,
        name: systemKey,
        description: `Default ${systemKey} role`,
        systemKey,
        isSystem: true,
        hierarchyLevel: SYSTEM_ROLE_HIERARCHY[systemKey],
      }),
    );
  }

  /**
   * Older builds stored a system-role id in `memberships.role_id`. The enum
   * column already carries that baseline role; `role_id` is only for a custom
   * role layered on top.
   */
  private async clearLegacySystemRoleAssignments(manager: EntityManager, systemRoles: Role[]): Promise<void> {
    await manager
      .getRepository(Membership)
      .update({ roleId: In(systemRoles.map((role) => role.id)) }, { roleId: null });
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
      'roles:read': { name: 'Read roles', description: 'Read roles and permissions' },
      'roles:create': { name: 'Create roles', description: 'Create custom roles' },
      'roles:update': { name: 'Update roles', description: 'Update custom roles' },
      'roles:delete': { name: 'Delete roles', description: 'Delete custom roles' },
      'permissions:manage': {
        name: 'Manage permissions',
        description: 'Assign and revoke permissions for roles and members',
      },
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
