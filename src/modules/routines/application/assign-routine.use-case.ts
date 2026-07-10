import { Inject, Injectable } from '@nestjs/common';
import { MemberNotFoundError } from '../../members/domain/member.errors';
import { MEMBER_REPOSITORY } from '../../members/domain/member.repository';
import type { MemberRepository } from '../../members/domain/member.repository';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { PERMISSION_REPOSITORY } from '../../permissions/domain/permission.repository';
import type { PermissionRepository } from '../../permissions/domain/permission.repository';
import { RoutineAssignment } from '../domain/routine-assignment.entity';
import { ROUTINE_ASSIGNMENT_REPOSITORY } from '../domain/routine-assignment.repository';
import type { RoutineAssignmentRepository } from '../domain/routine-assignment.repository';
import {
  DuplicateActiveAssignmentError,
  RoutineAssignmentOwnerMismatchError,
  RoutineNotFoundError,
} from '../domain/routine.errors';
import { ROUTINE_REPOSITORY } from '../domain/routine.repository';
import type { RoutineRepository } from '../domain/routine.repository';
import { AssignmentView, toAssignmentView } from '../interfaces/routine.view';

const STUDENT_ROLE_KEY = 'student';

export interface AssignRoutineCommand {
  callerUserId: string;
  gymId: string;
  routineId: string;
  memberId: string;
}

/**
 * Asigna una `Routine` a un `Member`. Un caller `student` solo puede
 * auto-asignarse (`memberId` = su propio member); instructor/admin/owner
 * pueden asignar a cualquiera (mismo criterio de `role.key` que en
 * create/update/remove-routine, ver nota en esos use cases).
 */
@Injectable()
export class AssignRoutineUseCase {
  constructor(
    @Inject(ROUTINE_REPOSITORY) private readonly routines: RoutineRepository,
    @Inject(ROUTINE_ASSIGNMENT_REPOSITORY) private readonly assignments: RoutineAssignmentRepository,
    @Inject(MEMBER_REPOSITORY) private readonly members: MemberRepository,
    @Inject(PERMISSION_REPOSITORY) private readonly permissionsRepo: PermissionRepository,
    private readonly permissions: GymPermissionService,
  ) {}

  async execute(command: AssignRoutineCommand): Promise<AssignmentView> {
    await this.permissions.requirePermission(command.callerUserId, command.gymId, PERMISSIONS.ROUTINES_ASSIGN);

    const routine = await this.routines.findById(command.gymId, command.routineId);
    if (!routine) {
      throw new RoutineNotFoundError(command.routineId);
    }

    const targetMember = await this.members.findById(command.gymId, command.memberId);
    if (!targetMember) {
      throw new MemberNotFoundError(command.memberId);
    }

    const caller = await this.members.findByGymAndUserId(command.gymId, command.callerUserId);
    if (caller) {
      const callerRole = await this.permissionsRepo.findRoleSummary(caller.roleId);
      if (callerRole?.key === STUDENT_ROLE_KEY && command.memberId !== caller.id) {
        throw new RoutineAssignmentOwnerMismatchError();
      }
    }

    const existing = await this.assignments.findActive(command.gymId, command.memberId, command.routineId);
    if (existing) {
      throw new DuplicateActiveAssignmentError();
    }

    const assignment = new RoutineAssignment();
    assignment.gymId = command.gymId;
    assignment.memberId = command.memberId;
    assignment.routineId = command.routineId;
    assignment.assignedByMemberId = caller?.id ?? null;
    assignment.assignedAt = new Date();
    assignment.unassignedAt = null;

    const saved = await this.assignments.save(assignment);
    return toAssignmentView(saved);
  }
}
