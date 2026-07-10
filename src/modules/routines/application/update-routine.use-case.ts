import { Inject, Injectable } from '@nestjs/common';
import { RoutineScope } from '../../../common/enums/routine-scope.enum';
import { MEMBER_REPOSITORY } from '../../members/domain/member.repository';
import type { MemberRepository } from '../../members/domain/member.repository';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { PERMISSION_REPOSITORY } from '../../permissions/domain/permission.repository';
import type { PermissionRepository } from '../../permissions/domain/permission.repository';
import { RoutineItemInput, ROUTINE_ITEM_REPOSITORY } from '../domain/routine-item.repository';
import type { RoutineItemRepository } from '../domain/routine-item.repository';
import { RoutineNotFoundError, RoutineOwnerMismatchError } from '../domain/routine.errors';
import { ROUTINE_REPOSITORY } from '../domain/routine.repository';
import type { RoutineRepository } from '../domain/routine.repository';
import { RoutineView, toRoutineView } from '../interfaces/routine.view';

const STUDENT_ROLE_KEY = 'student';

export interface UpdateRoutineCommand {
  callerUserId: string;
  gymId: string;
  routineId: string;
  name?: string;
  notes?: string;
  active?: boolean;
  items?: RoutineItemInput[];
}

@Injectable()
export class UpdateRoutineUseCase {
  constructor(
    @Inject(ROUTINE_REPOSITORY) private readonly routines: RoutineRepository,
    @Inject(ROUTINE_ITEM_REPOSITORY) private readonly routineItems: RoutineItemRepository,
    @Inject(MEMBER_REPOSITORY) private readonly members: MemberRepository,
    @Inject(PERMISSION_REPOSITORY) private readonly permissionsRepo: PermissionRepository,
    private readonly permissions: GymPermissionService,
  ) {}

  async execute(command: UpdateRoutineCommand): Promise<RoutineView> {
    await this.permissions.requirePermission(command.callerUserId, command.gymId, PERMISSIONS.ROUTINES_MANAGE);

    const routine = await this.routines.findById(command.gymId, command.routineId);
    if (!routine) {
      throw new RoutineNotFoundError(command.routineId);
    }

    const caller = await this.members.findByGymAndUserId(command.gymId, command.callerUserId);
    if (caller) {
      const callerRole = await this.permissionsRepo.findRoleSummary(caller.roleId);
      if (
        callerRole?.key === STUDENT_ROLE_KEY &&
        (routine.scope === RoutineScope.TEMPLATE || routine.ownerMemberId !== caller.id)
      ) {
        throw new RoutineOwnerMismatchError();
      }
    }

    if (command.name !== undefined) {
      routine.name = command.name;
    }
    if (command.notes !== undefined) {
      routine.notes = command.notes;
    }
    if (command.active !== undefined) {
      routine.active = command.active;
    }

    const saved = await this.routines.save(routine);
    const items = command.items
      ? await this.routineItems.replaceSet(command.gymId, saved.id, command.items)
      : await this.routineItems.listByRoutine(saved.id);

    return toRoutineView(saved, items);
  }
}
