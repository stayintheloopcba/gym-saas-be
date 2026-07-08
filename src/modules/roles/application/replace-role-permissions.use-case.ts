import { Inject, Injectable } from '@nestjs/common';
import { PERMISSION_CATALOG_REPOSITORY } from '../../permissions/domain/permission-catalog.repository';
import type { PermissionCatalogRepository } from '../../permissions/domain/permission-catalog.repository';
import { UnknownPermissionError } from '../../permissions/domain/permission.errors';
import { ROLE_PERMISSION_REPOSITORY } from '../../permissions/domain/role-permission.repository';
import type { RolePermissionRepository } from '../../permissions/domain/role-permission.repository';
import { RoleNotFoundError } from '../domain/role.errors';
import { ROLE_REPOSITORY } from '../domain/role.repository';
import type { RoleRepository } from '../domain/role.repository';

export interface ReplaceRolePermissionsCommand {
  roleId: string;
  permissionCodes: string[];
}

/** Platform-admin only. Reemplaza el set completo de `role_permissions` de un rol. */
@Injectable()
export class ReplaceRolePermissionsUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
    @Inject(ROLE_PERMISSION_REPOSITORY) private readonly rolePermissions: RolePermissionRepository,
    @Inject(PERMISSION_CATALOG_REPOSITORY) private readonly catalog: PermissionCatalogRepository,
  ) {}

  async execute(command: ReplaceRolePermissionsCommand): Promise<void> {
    const role = await this.roles.findById(command.roleId);
    if (!role) {
      throw new RoleNotFoundError(command.roleId);
    }

    for (const code of command.permissionCodes) {
      if (!(await this.catalog.existsActive(code))) {
        throw new UnknownPermissionError(code);
      }
    }

    await this.rolePermissions.replacePermissions(command.roleId, command.permissionCodes);
  }
}
