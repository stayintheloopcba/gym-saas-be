import { Inject, Injectable } from '@nestjs/common';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { PERMISSION_REPOSITORY } from '../../permissions/domain/permission.repository';
import type { PermissionRepository } from '../../permissions/domain/permission.repository';
import { MembershipNotFoundError, SoleOwnerError } from '../domain/membership.errors';
import { MEMBERSHIP_REPOSITORY } from '../domain/membership.repository';
import type { MembershipRepository } from '../domain/membership.repository';

const OWNER_ROLE_KEY = 'owner';

export interface RemoveMemberCommand {
  callerUserId: string;
  gymId: string;
  targetUserId: string;
}

/**
 * Remueve (soft delete) la membresía de un usuario en una organización.
 *
 * Requiere el permiso `members:remove`. Protege el invariante de único owner:
 * no se puede remover al último miembro con el rol `owner` (`SoleOwnerError`).
 */
@Injectable()
export class RemoveMemberUseCase {
  constructor(
    @Inject(MEMBERSHIP_REPOSITORY) private readonly memberships: MembershipRepository,
    @Inject(PERMISSION_REPOSITORY) private readonly permissionsRepo: PermissionRepository,
    private readonly permissions: GymPermissionService,
  ) {}

  async execute(command: RemoveMemberCommand): Promise<void> {
    const { callerUserId, gymId, targetUserId } = command;

    await this.permissions.requirePermission(callerUserId, gymId, PERMISSIONS.MEMBERS_REMOVE);

    const target = await this.memberships.findByUserAndOrg(targetUserId, gymId);
    if (!target) {
      throw new MembershipNotFoundError(`${targetUserId}@${gymId}`);
    }

    const role = await this.permissionsRepo.findRoleSummary(target.roleId);
    if (role?.key === OWNER_ROLE_KEY) {
      const owners = await this.memberships.countByRoleInOrg(gymId, target.roleId);
      if (owners <= 1) {
        throw new SoleOwnerError();
      }
    }

    await this.memberships.softDelete(target.id);
  }
}
