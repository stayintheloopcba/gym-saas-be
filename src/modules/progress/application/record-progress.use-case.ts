import { Inject, Injectable } from '@nestjs/common';
import { MemberNotFoundError } from '../../members/domain/member.errors';
import { MEMBER_REPOSITORY } from '../../members/domain/member.repository';
import type { MemberRepository } from '../../members/domain/member.repository';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { PERMISSION_REPOSITORY } from '../../permissions/domain/permission.repository';
import type { PermissionRepository } from '../../permissions/domain/permission.repository';
import { RoutineItemNotFoundError } from '../../routines/domain/routine.errors';
import { ROUTINE_ITEM_REPOSITORY } from '../../routines/domain/routine-item.repository';
import type { RoutineItemRepository } from '../../routines/domain/routine-item.repository';
import { ProgressEntry } from '../domain/progress-entry.entity';
import { ProgressOwnerMismatchError } from '../domain/progress.errors';
import { PROGRESS_REPOSITORY } from '../domain/progress.repository';
import type { ProgressRepository } from '../domain/progress.repository';
import { ProgressEntryView, toProgressEntryView } from '../interfaces/progress.view';

const STUDENT_ROLE_KEY = 'student';

export interface RecordProgressCommand {
  callerUserId: string;
  gymId: string;
  memberId: string;
  routineItemId?: string;
  value: number;
  reps?: number;
}

/** Registra una marca de progreso. Un caller `student` solo puede registrar la suya propia. */
@Injectable()
export class RecordProgressUseCase {
  constructor(
    @Inject(PROGRESS_REPOSITORY) private readonly progress: ProgressRepository,
    @Inject(MEMBER_REPOSITORY) private readonly members: MemberRepository,
    @Inject(ROUTINE_ITEM_REPOSITORY) private readonly routineItems: RoutineItemRepository,
    @Inject(PERMISSION_REPOSITORY) private readonly permissionsRepo: PermissionRepository,
    private readonly permissions: GymPermissionService,
  ) {}

  async execute(command: RecordProgressCommand): Promise<ProgressEntryView> {
    await this.permissions.requirePermission(command.callerUserId, command.gymId, PERMISSIONS.PROGRESS_RECORD);

    const targetMember = await this.members.findById(command.gymId, command.memberId);
    if (!targetMember) {
      throw new MemberNotFoundError(command.memberId);
    }

    if (command.routineItemId) {
      const routineItem = await this.routineItems.findById(command.gymId, command.routineItemId);
      if (!routineItem) {
        throw new RoutineItemNotFoundError(command.routineItemId);
      }
    }

    const caller = await this.members.findByGymAndUserId(command.gymId, command.callerUserId);
    if (caller) {
      const callerRole = await this.permissionsRepo.findRoleSummary(caller.roleId);
      if (callerRole?.key === STUDENT_ROLE_KEY && command.memberId !== caller.id) {
        throw new ProgressOwnerMismatchError();
      }
    }

    const entry = new ProgressEntry();
    entry.gymId = command.gymId;
    entry.memberId = command.memberId;
    entry.routineItemId = command.routineItemId ?? null;
    entry.value = command.value;
    entry.reps = command.reps ?? null;
    entry.recordedAt = new Date();

    const saved = await this.progress.save(entry);
    return toProgressEntryView(saved);
  }
}
