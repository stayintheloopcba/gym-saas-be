import { Inject, Injectable } from '@nestjs/common';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { PERMISSION_REPOSITORY } from '../../permissions/domain/permission.repository';
import type { PermissionRepository } from '../../permissions/domain/permission.repository';
import { MemberNotFoundError, SoleOwnerError } from '../domain/member.errors';
import { MEMBER_REPOSITORY } from '../domain/member.repository';
import type { MemberRepository } from '../domain/member.repository';

const OWNER_ROLE_KEY = 'owner';

/**
 * Elimina (soft delete) un `Member` del gym.
 *
 * Protege el invariante de único owner (portado de `memberships`, ver tarea
 * 8): no se puede remover al último `Member` con el rol `owner`.
 */
@Injectable()
export class RemoveMemberUseCase {
  constructor(
    @Inject(MEMBER_REPOSITORY) private readonly members: MemberRepository,
    @Inject(PERMISSION_REPOSITORY) private readonly permissionsRepo: PermissionRepository,
    private readonly permissions: GymPermissionService,
  ) {}

  async execute(callerUserId: string, gymId: string, memberId: string): Promise<void> {
    await this.permissions.requirePermission(callerUserId, gymId, PERMISSIONS.MEMBERS_REMOVE);

    const member = await this.members.findById(gymId, memberId);
    if (!member) {
      throw new MemberNotFoundError(memberId);
    }

    const role = await this.permissionsRepo.findRoleSummary(member.roleId);
    if (role?.key === OWNER_ROLE_KEY) {
      const owners = await this.members.countByRoleInGym(gymId, member.roleId);
      if (owners <= 1) {
        throw new SoleOwnerError();
      }
    }

    await this.members.softDelete(member.id);
  }
}
