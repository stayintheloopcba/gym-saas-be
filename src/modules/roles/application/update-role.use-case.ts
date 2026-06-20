import { Inject, Injectable } from '@nestjs/common';
import { HierarchyLevel } from '../../../common/enums/hierarchy-level.enum';
import { OrganizationPermissionService } from '../../permissions/application/organization-permission.service';
import { OwnershipContextService } from '../../permissions/application/ownership-context.service';
import { Role } from '../../permissions/domain/role.entity';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { RoleNameConflictError, RoleNotFoundError, SystemRoleImmutableError } from '../domain/role.errors';
import { ROLE_REPOSITORY } from '../domain/role.repository';
import type { RoleRepository } from '../domain/role.repository';
import { assertWithinCallerHierarchy } from './role-hierarchy.guard-helper';

export interface UpdateRoleCommand {
  callerUserId: string;
  organizationId: string;
  roleId: string;
  name?: string;
  description?: string;
  hierarchyLevel?: HierarchyLevel;
}

@Injectable()
export class UpdateRoleUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
    private readonly permissions: OrganizationPermissionService,
    private readonly ownership: OwnershipContextService,
  ) {}

  async execute(command: UpdateRoleCommand): Promise<Role> {
    const { callerUserId, organizationId, roleId, name, description, hierarchyLevel } = command;

    await this.permissions.requirePermission(callerUserId, organizationId, PERMISSIONS.ROLES_UPDATE);

    const role = await this.roles.findById(roleId);
    if (role?.isSystem) {
      throw new SystemRoleImmutableError();
    }
    if (!role || role.organizationId !== organizationId) {
      throw new RoleNotFoundError(roleId);
    }

    if (hierarchyLevel != null) {
      await assertWithinCallerHierarchy(this.ownership, callerUserId, organizationId, hierarchyLevel);
      role.hierarchyLevel = hierarchyLevel;
    }

    if (name != null && name !== role.name) {
      const conflict = await this.roles.findActiveByName(organizationId, name);
      if (conflict && conflict.id !== role.id) {
        throw new RoleNameConflictError(name);
      }
      role.name = name;
    }

    if (description !== undefined) {
      role.description = description;
    }

    return this.roles.save(role);
  }
}
