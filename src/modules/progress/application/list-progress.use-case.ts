import { Inject, Injectable } from '@nestjs/common';
import { MemberNotFoundError } from '../../members/domain/member.errors';
import { MEMBER_REPOSITORY } from '../../members/domain/member.repository';
import type { MemberRepository } from '../../members/domain/member.repository';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { PERMISSION_REPOSITORY } from '../../permissions/domain/permission.repository';
import type { PermissionRepository } from '../../permissions/domain/permission.repository';
import { ProgressListFilters, PROGRESS_REPOSITORY } from '../domain/progress.repository';
import type { ProgressRepository } from '../domain/progress.repository';
import { ProgressEntryView, toProgressEntryView } from '../interfaces/progress.view';

const STUDENT_ROLE_KEY = 'student';

@Injectable()
export class ListProgressUseCase {
  constructor(
    @Inject(PROGRESS_REPOSITORY) private readonly progress: ProgressRepository,
    @Inject(MEMBER_REPOSITORY) private readonly members: MemberRepository,
    @Inject(PERMISSION_REPOSITORY) private readonly permissionsRepo: PermissionRepository,
    private readonly permissions: GymPermissionService,
  ) {}

  async execute(
    callerUserId: string,
    gymId: string,
    memberId: string,
    filters: ProgressListFilters,
  ): Promise<ProgressEntryView[]> {
    await this.permissions.requirePermission(callerUserId, gymId, PERMISSIONS.PROGRESS_READ);

    const caller = await this.members.findByGymAndUserId(gymId, callerUserId);
    if (caller) {
      const callerRole = await this.permissionsRepo.findRoleSummary(caller.roleId);
      if (callerRole?.key === STUDENT_ROLE_KEY && memberId !== caller.id) {
        throw new MemberNotFoundError(memberId);
      }
    }

    const entries = await this.progress.list(gymId, memberId, filters);
    return entries.map(toProgressEntryView);
  }
}
