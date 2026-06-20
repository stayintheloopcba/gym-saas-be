import { Inject, Injectable } from '@nestjs/common';
import { MembershipRole } from '../../../common/enums/membership-role.enum';
import { OrganizationPermissionService } from '../../permissions/application/organization-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { MembershipNotFoundError, SoleOwnerError } from '../domain/membership.errors';
import { MEMBERSHIP_REPOSITORY } from '../domain/membership.repository';
import type { MembershipRepository } from '../domain/membership.repository';

export interface RemoveMemberCommand {
  callerUserId: string;
  organizationId: string;
  targetUserId: string;
}

/**
 * Remueve (soft delete) la membresía de un usuario en una organización.
 *
 * Requiere que el llamador sea `OWNER`/`ADMIN`. Protege el invariante de único
 * owner: no se puede remover al último `OWNER` (`SoleOwnerError`).
 */
@Injectable()
export class RemoveMemberUseCase {
  constructor(
    @Inject(MEMBERSHIP_REPOSITORY) private readonly memberships: MembershipRepository,
    private readonly permissions: OrganizationPermissionService,
  ) {}

  async execute(command: RemoveMemberCommand): Promise<void> {
    const { callerUserId, organizationId, targetUserId } = command;

    await this.permissions.requirePermission(callerUserId, organizationId, PERMISSIONS.MEMBERS_REMOVE);

    const target = await this.memberships.findByUserAndOrg(targetUserId, organizationId);
    if (!target) {
      throw new MembershipNotFoundError(`${targetUserId}@${organizationId}`);
    }

    if (target.role === MembershipRole.OWNER) {
      const owners = await this.memberships.countOwners(organizationId);
      if (owners <= 1) {
        throw new SoleOwnerError();
      }
    }

    await this.memberships.softDelete(target.id);
  }
}
