import { Inject, Injectable } from '@nestjs/common';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { PERMISSION_REPOSITORY } from '../../permissions/domain/permission.repository';
import type { PermissionRepository } from '../../permissions/domain/permission.repository';
import { MemberNotFoundError } from '../domain/member.errors';
import { MEMBER_REPOSITORY } from '../domain/member.repository';
import type { MemberRepository } from '../domain/member.repository';
import { MemberView, toMemberView } from '../interfaces/member.view';

@Injectable()
export class GetMemberUseCase {
  constructor(
    @Inject(MEMBER_REPOSITORY) private readonly members: MemberRepository,
    @Inject(PERMISSION_REPOSITORY) private readonly permissionsRepo: PermissionRepository,
    private readonly permissions: GymPermissionService,
  ) {}

  async execute(callerUserId: string, gymId: string, memberId: string): Promise<MemberView> {
    await this.permissions.requirePermission(callerUserId, gymId, PERMISSIONS.MEMBERS_READ);

    const member = await this.members.findById(gymId, memberId);
    if (!member) {
      throw new MemberNotFoundError(memberId);
    }

    const role = await this.permissionsRepo.findRoleSummary(member.roleId);
    if (!role) {
      throw new MemberNotFoundError(memberId);
    }

    return toMemberView(member, role);
  }
}
