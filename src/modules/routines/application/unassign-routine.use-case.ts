import { Inject, Injectable } from '@nestjs/common';
import { MEMBER_REPOSITORY } from '../../members/domain/member.repository';
import type { MemberRepository } from '../../members/domain/member.repository';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { PERMISSION_REPOSITORY } from '../../permissions/domain/permission.repository';
import type { PermissionRepository } from '../../permissions/domain/permission.repository';
import { ROUTINE_ASSIGNMENT_REPOSITORY } from '../domain/routine-assignment.repository';
import type { RoutineAssignmentRepository } from '../domain/routine-assignment.repository';
import { RoutineAssignmentNotFoundError, RoutineAssignmentOwnerMismatchError } from '../domain/routine.errors';
import { AssignmentView, toAssignmentView } from '../interfaces/routine.view';

const STUDENT_ROLE_KEY = 'student';

@Injectable()
export class UnassignRoutineUseCase {
  constructor(
    @Inject(ROUTINE_ASSIGNMENT_REPOSITORY) private readonly assignments: RoutineAssignmentRepository,
    @Inject(MEMBER_REPOSITORY) private readonly members: MemberRepository,
    @Inject(PERMISSION_REPOSITORY) private readonly permissionsRepo: PermissionRepository,
    private readonly permissions: GymPermissionService,
  ) {}

  async execute(callerUserId: string, gymId: string, assignmentId: string): Promise<AssignmentView> {
    await this.permissions.requirePermission(callerUserId, gymId, PERMISSIONS.ROUTINES_ASSIGN);

    const assignment = await this.assignments.findById(gymId, assignmentId);
    if (!assignment) {
      throw new RoutineAssignmentNotFoundError(assignmentId);
    }

    const caller = await this.members.findByGymAndUserId(gymId, callerUserId);
    if (caller) {
      const callerRole = await this.permissionsRepo.findRoleSummary(caller.roleId);
      if (callerRole?.key === STUDENT_ROLE_KEY && assignment.memberId !== caller.id) {
        throw new RoutineAssignmentOwnerMismatchError();
      }
    }

    if (!assignment.unassignedAt) {
      assignment.unassignedAt = new Date();
    }

    const saved = await this.assignments.save(assignment);
    return toAssignmentView(saved);
  }
}
