import { Inject, Injectable } from '@nestjs/common';
import { HierarchyLevel } from '../../../common/enums/hierarchy-level.enum';
import { OrganizationPermissionService } from '../../permissions/application/organization-permission.service';
import { OwnershipContextService } from '../../permissions/application/ownership-context.service';
import { Role } from '../../permissions/domain/role.entity';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { RoleNameConflictError } from '../domain/role.errors';
import { ROLE_REPOSITORY } from '../domain/role.repository';
import type { RoleRepository } from '../domain/role.repository';
import { assertWithinCallerHierarchy } from './role-hierarchy.guard-helper';

export interface CreateRoleCommand {
  callerUserId: string;
  organizationId: string;
  name: string;
  description?: string;
  hierarchyLevel: HierarchyLevel;
}

@Injectable()
export class CreateRoleUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
    private readonly permissions: OrganizationPermissionService,
    private readonly ownership: OwnershipContextService,
  ) {}

  async execute(command: CreateRoleCommand): Promise<Role> {
    const { callerUserId, organizationId, name, description, hierarchyLevel } = command;

    await this.permissions.requirePermission(callerUserId, organizationId, PERMISSIONS.ROLES_CREATE);
    await assertWithinCallerHierarchy(this.ownership, callerUserId, organizationId, hierarchyLevel);

    const existing = await this.roles.findActiveByName(organizationId, name);
    if (existing) {
      throw new RoleNameConflictError(name);
    }

    const role = Object.assign(new Role(), {
      organizationId,
      name,
      description,
      systemKey: null,
      isSystem: false,
      hierarchyLevel,
    });
    return this.roles.save(role);
  }
}
