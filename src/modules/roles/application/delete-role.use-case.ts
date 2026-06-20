import { Inject, Injectable } from '@nestjs/common';
import { MEMBERSHIP_REPOSITORY } from '../../memberships/domain/membership.repository';
import type { MembershipRepository } from '../../memberships/domain/membership.repository';
import { OrganizationPermissionService } from '../../permissions/application/organization-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { RoleInUseError, RoleNotFoundError, SystemRoleImmutableError } from '../domain/role.errors';
import { ROLE_REPOSITORY } from '../domain/role.repository';
import type { RoleRepository } from '../domain/role.repository';

@Injectable()
export class DeleteRoleUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
    @Inject(MEMBERSHIP_REPOSITORY) private readonly memberships: MembershipRepository,
    private readonly permissions: OrganizationPermissionService,
  ) {}

  async execute(callerUserId: string, organizationId: string, roleId: string): Promise<void> {
    await this.permissions.requirePermission(callerUserId, organizationId, PERMISSIONS.ROLES_DELETE);

    const role = await this.roles.findById(roleId);
    if (role?.isSystem) {
      throw new SystemRoleImmutableError();
    }
    if (!role || role.organizationId !== organizationId) {
      throw new RoleNotFoundError(roleId);
    }

    const inUse = await this.memberships.countByRole(roleId);
    if (inUse > 0) {
      throw new RoleInUseError();
    }

    await this.roles.softDelete(roleId);
  }
}
