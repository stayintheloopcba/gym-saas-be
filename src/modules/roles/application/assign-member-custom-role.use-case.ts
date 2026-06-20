import { Inject, Injectable } from '@nestjs/common';
import { MembershipRole } from '../../../common/enums/membership-role.enum';
import { MEMBERSHIP_REPOSITORY } from '../../memberships/domain/membership.repository';
import type { MembershipRepository } from '../../memberships/domain/membership.repository';
import {
  CannotChangeOwnRoleError,
  InsufficientRoleError,
  MembershipNotFoundError,
} from '../../memberships/domain/membership.errors';
import type { OrganizationMember } from '../../memberships/application/list-organization-members.use-case';
import { OrganizationPermissionService } from '../../permissions/application/organization-permission.service';
import { OwnershipContextService } from '../../permissions/application/ownership-context.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { FindUserByIdUseCase } from '../../users/application/find-user.use-cases';
import { toPublicProfile } from '../../users/application/user-public-profile';
import { ROLE_REPOSITORY } from '../domain/role.repository';
import type { RoleRepository } from '../domain/role.repository';
import { RoleNotFoundError } from '../domain/role.errors';
import { assertWithinCallerHierarchy } from './role-hierarchy.guard-helper';

export interface AssignMemberCustomRoleCommand {
  callerUserId: string;
  organizationId: string;
  targetUserId: string;
  roleId: string | null;
}

/** Assigns or clears the custom role layered on top of a membership's system role. */
@Injectable()
export class AssignMemberCustomRoleUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
    @Inject(MEMBERSHIP_REPOSITORY) private readonly memberships: MembershipRepository,
    private readonly permissions: OrganizationPermissionService,
    private readonly ownership: OwnershipContextService,
    private readonly findUserById: FindUserByIdUseCase,
  ) {}

  async execute(command: AssignMemberCustomRoleCommand): Promise<OrganizationMember> {
    const { callerUserId, organizationId, targetUserId, roleId } = command;
    await this.permissions.requirePermission(callerUserId, organizationId, PERMISSIONS.MEMBERS_UPDATE_ROLE);

    if (callerUserId === targetUserId) {
      throw new CannotChangeOwnRoleError();
    }

    const [target, callerContext, targetContext] = await Promise.all([
      this.memberships.findByUserAndOrg(targetUserId, organizationId),
      this.ownership.build(callerUserId, organizationId),
      this.ownership.build(targetUserId, organizationId),
    ]);
    if (!target) {
      throw new MembershipNotFoundError(`${targetUserId}@${organizationId}`);
    }
    if (!callerContext || !targetContext) {
      throw new MembershipNotFoundError(`${callerUserId}@${organizationId}`);
    }
    if (targetContext.hierarchyLevel > callerContext.hierarchyLevel) {
      throw new InsufficientRoleError();
    }

    if (roleId) {
      const role = await this.roles.findById(roleId);
      if (!role || role.isSystem || role.organizationId !== organizationId) {
        throw new RoleNotFoundError(roleId);
      }
      await assertWithinCallerHierarchy(this.ownership, callerUserId, organizationId, role.hierarchyLevel);
      target.roleId = role.id;
    } else {
      target.roleId = null;
    }

    const saved = await this.memberships.save(target);
    const user = await this.findUserById.execute(saved.userId);
    if (!user) {
      throw new MembershipNotFoundError(`${saved.userId}@membership`);
    }

    return {
      membershipId: saved.id,
      role: saved.role as MembershipRole,
      customRoleId: saved.roleId ?? null,
      user: toPublicProfile(user),
    };
  }
}
