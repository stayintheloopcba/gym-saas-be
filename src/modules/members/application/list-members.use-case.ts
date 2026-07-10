import { Inject, Injectable } from '@nestjs/common';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { PERMISSION_REPOSITORY } from '../../permissions/domain/permission.repository';
import type { PermissionRepository } from '../../permissions/domain/permission.repository';
import { MemberListFilters, MEMBER_REPOSITORY } from '../domain/member.repository';
import type { MemberRepository } from '../domain/member.repository';
import { MemberView, toMemberView } from '../interfaces/member.view';
import { ResolveMemberStatus } from './resolve-member-status';

@Injectable()
export class ListMembersUseCase {
  constructor(
    @Inject(MEMBER_REPOSITORY) private readonly members: MemberRepository,
    @Inject(PERMISSION_REPOSITORY) private readonly permissionsRepo: PermissionRepository,
    private readonly resolveMemberStatus: ResolveMemberStatus,
    private readonly permissions: GymPermissionService,
  ) {}

  async execute(callerUserId: string, gymId: string, filters: MemberListFilters): Promise<MemberView[]> {
    await this.permissions.requirePermission(callerUserId, gymId, PERMISSIONS.MEMBERS_READ);

    const members = await this.members.list(gymId, filters);

    const views: MemberView[] = [];
    for (const member of members) {
      const role = await this.permissionsRepo.findRoleSummary(member.roleId);
      if (role) {
        const status = await this.resolveMemberStatus.execute(gymId, member);
        views.push(toMemberView(member, role, status));
      }
    }
    return views;
  }
}
