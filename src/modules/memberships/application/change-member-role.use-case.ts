import { Inject, Injectable } from '@nestjs/common';
import { MEMBERSHIP_ROLE_RANK, MembershipRole } from '../../../common/enums/membership-role.enum';
import { OrganizationPermissionService } from '../../permissions/application/organization-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { FindUserByIdUseCase } from '../../users/application/find-user.use-cases';
import { toPublicProfile } from '../../users/application/user-public-profile';
import {
  CannotChangeOwnRoleError,
  InsufficientRoleError,
  MembershipNotFoundError,
  SoleOwnerError,
} from '../domain/membership.errors';
import { MEMBERSHIP_REPOSITORY } from '../domain/membership.repository';
import type { MembershipRepository } from '../domain/membership.repository';
import { OrganizationMember } from './list-organization-members.use-case';

export interface ChangeMemberRoleCommand {
  callerUserId: string;
  organizationId: string;
  targetUserId: string;
  role: MembershipRole;
}

/**
 * Cambia el rol (de sistema) de un miembro dentro de una organización.
 *
 * Invariantes de negocio que protege:
 * - El llamador necesita el permiso `members:update_role`.
 * - Nadie puede cambiar su propio rol (`CannotChangeOwnRoleError`).
 * - Jerarquía: no se puede actuar sobre un miembro de rango superior al propio,
 *   ni asignar un rol por encima del propio (`InsufficientRoleError`).
 * - No se puede degradar al único `OWNER` (`SoleOwnerError`).
 *
 * Promover a `OWNER` queda fuera de alcance: la transferencia de propiedad será
 * un flujo aparte (los roles asignables se restringen en el DTO).
 */
@Injectable()
export class ChangeMemberRoleUseCase {
  constructor(
    @Inject(MEMBERSHIP_REPOSITORY) private readonly memberships: MembershipRepository,
    private readonly permissions: OrganizationPermissionService,
    private readonly findUserById: FindUserByIdUseCase,
  ) {}

  async execute(command: ChangeMemberRoleCommand): Promise<OrganizationMember> {
    const { callerUserId, organizationId, targetUserId, role } = command;

    await this.permissions.requirePermission(callerUserId, organizationId, PERMISSIONS.MEMBERS_UPDATE_ROLE);

    if (callerUserId === targetUserId) {
      throw new CannotChangeOwnRoleError();
    }

    const target = await this.memberships.findByUserAndOrg(targetUserId, organizationId);
    if (!target) {
      throw new MembershipNotFoundError(`${targetUserId}@${organizationId}`);
    }

    const caller = await this.memberships.findByUserAndOrg(callerUserId, organizationId);
    if (!caller) {
      throw new MembershipNotFoundError(`${callerUserId}@${organizationId}`);
    }

    const callerRank = MEMBERSHIP_ROLE_RANK[caller.role];
    if (MEMBERSHIP_ROLE_RANK[target.role] > callerRank || MEMBERSHIP_ROLE_RANK[role] > callerRank) {
      throw new InsufficientRoleError();
    }

    if (target.role === role) {
      return this.toMember(target);
    }

    if (target.role === MembershipRole.OWNER && role !== MembershipRole.OWNER) {
      const owners = await this.memberships.countOwners(organizationId);
      if (owners <= 1) {
        throw new SoleOwnerError();
      }
    }

    target.role = role;
    target.roleId = null;
    const saved = await this.memberships.save(target);
    return this.toMember(saved);
  }

  private async toMember(membership: {
    id: string;
    userId: string;
    role: MembershipRole;
    roleId: string | null;
  }): Promise<OrganizationMember> {
    const user = await this.findUserById.execute(membership.userId);
    if (!user) {
      throw new MembershipNotFoundError(`${membership.userId}@membership`);
    }
    return {
      membershipId: membership.id,
      role: membership.role,
      customRoleId: membership.roleId ?? null,
      user: toPublicProfile(user),
    };
  }
}
