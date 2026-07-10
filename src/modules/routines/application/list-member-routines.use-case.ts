import { Inject, Injectable } from '@nestjs/common';
import { MemberNotFoundError } from '../../members/domain/member.errors';
import { MEMBER_REPOSITORY } from '../../members/domain/member.repository';
import type { MemberRepository } from '../../members/domain/member.repository';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { PERMISSION_REPOSITORY } from '../../permissions/domain/permission.repository';
import type { PermissionRepository } from '../../permissions/domain/permission.repository';
import { ROUTINE_ITEM_REPOSITORY } from '../domain/routine-item.repository';
import type { RoutineItemRepository } from '../domain/routine-item.repository';
import { ROUTINE_ASSIGNMENT_REPOSITORY } from '../domain/routine-assignment.repository';
import type { RoutineAssignmentRepository } from '../domain/routine-assignment.repository';
import { ROUTINE_REPOSITORY } from '../domain/routine.repository';
import type { RoutineRepository } from '../domain/routine.repository';
import { MemberRoutineView, toMemberRoutineView, toRoutineView } from '../interfaces/routine.view';

const STUDENT_ROLE_KEY = 'student';

@Injectable()
export class ListMemberRoutinesUseCase {
  constructor(
    @Inject(ROUTINE_ASSIGNMENT_REPOSITORY) private readonly assignments: RoutineAssignmentRepository,
    @Inject(ROUTINE_REPOSITORY) private readonly routines: RoutineRepository,
    @Inject(ROUTINE_ITEM_REPOSITORY) private readonly routineItems: RoutineItemRepository,
    @Inject(MEMBER_REPOSITORY) private readonly members: MemberRepository,
    @Inject(PERMISSION_REPOSITORY) private readonly permissionsRepo: PermissionRepository,
    private readonly permissions: GymPermissionService,
  ) {}

  async execute(callerUserId: string, gymId: string, memberId: string): Promise<MemberRoutineView[]> {
    await this.permissions.requirePermission(callerUserId, gymId, PERMISSIONS.ROUTINES_READ);

    const caller = await this.members.findByGymAndUserId(gymId, callerUserId);
    if (caller) {
      const callerRole = await this.permissionsRepo.findRoleSummary(caller.roleId);
      if (callerRole?.key === STUDENT_ROLE_KEY && memberId !== caller.id) {
        throw new MemberNotFoundError(memberId);
      }
    }

    const activeAssignments = await this.assignments.listActiveByMember(gymId, memberId);

    const views = await Promise.all(
      activeAssignments.map(async (assignment) => {
        const routine = await this.routines.findById(gymId, assignment.routineId);
        if (!routine) {
          return null;
        }
        const items = await this.routineItems.listByRoutine(routine.id);
        return toMemberRoutineView(assignment, toRoutineView(routine, items));
      }),
    );

    return views.filter((view): view is MemberRoutineView => view !== null);
  }
}
