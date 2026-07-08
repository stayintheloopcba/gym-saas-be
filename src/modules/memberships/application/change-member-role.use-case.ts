import { Inject, Injectable } from '@nestjs/common';
import { OrganizationPermissionService } from '../../permissions/application/organization-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { PERMISSION_REPOSITORY } from '../../permissions/domain/permission.repository';
import type { PermissionRepository } from '../../permissions/domain/permission.repository';
import { RoleSummary } from '../../permissions/domain/role-summary';
import { FindUserByIdUseCase } from '../../users/application/find-user.use-cases';
import { toPublicProfile } from '../../users/application/user-public-profile';
import {
  CannotChangeOwnRoleError,
  MembershipNotFoundError,
  OwnerRoleNotAssignableError,
  SoleOwnerError,
  UnknownRoleError,
} from '../domain/membership.errors';
import { MEMBERSHIP_REPOSITORY } from '../domain/membership.repository';
import type { MembershipRepository } from '../domain/membership.repository';
import { OrganizationMember } from './list-organization-members.use-case';

const OWNER_ROLE_KEY = 'owner';

export interface ChangeMemberRoleCommand {
  callerUserId: string;
  organizationId: string;
  targetUserId: string;
  roleId: string;
}

/**
 * Cambia el rol (del catálogo) de un miembro dentro de una organización.
 *
 * Invariantes de negocio que protege:
 * - El llamador necesita el permiso `members:update_role`.
 * - Nadie puede cambiar su propio rol (`CannotChangeOwnRoleError`).
 * - El `roleId` debe existir en el catálogo (`UnknownRoleError`).
 * - El rol `owner` no es asignable por esta vía (`OwnerRoleNotAssignableError`):
 *   solo se otorga automáticamente al crear la organización.
 * - No se puede degradar al único `owner` (`SoleOwnerError`).
 */
@Injectable()
export class ChangeMemberRoleUseCase {
  constructor(
    @Inject(MEMBERSHIP_REPOSITORY) private readonly memberships: MembershipRepository,
    @Inject(PERMISSION_REPOSITORY) private readonly permissionsRepo: PermissionRepository,
    private readonly permissions: OrganizationPermissionService,
    private readonly findUserById: FindUserByIdUseCase,
  ) {}

  async execute(command: ChangeMemberRoleCommand): Promise<OrganizationMember> {
    const { callerUserId, organizationId, targetUserId, roleId } = command;

    await this.permissions.requirePermission(callerUserId, organizationId, PERMISSIONS.MEMBERS_UPDATE_ROLE);

    if (callerUserId === targetUserId) {
      throw new CannotChangeOwnRoleError();
    }

    const role = await this.permissionsRepo.findRoleSummary(roleId);
    if (!role) {
      throw new UnknownRoleError(roleId);
    }
    if (role.key === OWNER_ROLE_KEY) {
      throw new OwnerRoleNotAssignableError();
    }

    const target = await this.memberships.findByUserAndOrg(targetUserId, organizationId);
    if (!target) {
      throw new MembershipNotFoundError(`${targetUserId}@${organizationId}`);
    }

    if (target.roleId === role.id) {
      return this.toMember(target, role);
    }

    const currentRole = await this.permissionsRepo.findRoleSummary(target.roleId);
    if (currentRole?.key === OWNER_ROLE_KEY) {
      const owners = await this.memberships.countByRoleInOrg(organizationId, target.roleId);
      if (owners <= 1) {
        throw new SoleOwnerError();
      }
    }

    target.roleId = role.id;
    const saved = await this.memberships.save(target);
    return this.toMember(saved, role);
  }

  private async toMember(membership: { id: string; userId: string }, role: RoleSummary): Promise<OrganizationMember> {
    const user = await this.findUserById.execute(membership.userId);
    if (!user) {
      throw new MembershipNotFoundError(`${membership.userId}@membership`);
    }
    return { membershipId: membership.id, role, user: toPublicProfile(user) };
  }
}
