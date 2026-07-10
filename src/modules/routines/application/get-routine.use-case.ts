import { Inject, Injectable } from '@nestjs/common';
import { RoutineScope } from '../../../common/enums/routine-scope.enum';
import { MEMBER_REPOSITORY } from '../../members/domain/member.repository';
import type { MemberRepository } from '../../members/domain/member.repository';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { PERMISSION_REPOSITORY } from '../../permissions/domain/permission.repository';
import type { PermissionRepository } from '../../permissions/domain/permission.repository';
import { ROUTINE_ITEM_REPOSITORY } from '../domain/routine-item.repository';
import type { RoutineItemRepository } from '../domain/routine-item.repository';
import { RoutineNotFoundError } from '../domain/routine.errors';
import { ROUTINE_REPOSITORY } from '../domain/routine.repository';
import type { RoutineRepository } from '../domain/routine.repository';
import { RoutineView, toRoutineView } from '../interfaces/routine.view';

const STUDENT_ROLE_KEY = 'student';

@Injectable()
export class GetRoutineUseCase {
  constructor(
    @Inject(ROUTINE_REPOSITORY) private readonly routines: RoutineRepository,
    @Inject(ROUTINE_ITEM_REPOSITORY) private readonly routineItems: RoutineItemRepository,
    @Inject(MEMBER_REPOSITORY) private readonly members: MemberRepository,
    @Inject(PERMISSION_REPOSITORY) private readonly permissionsRepo: PermissionRepository,
    private readonly permissions: GymPermissionService,
  ) {}

  async execute(callerUserId: string, gymId: string, routineId: string): Promise<RoutineView> {
    await this.permissions.requirePermission(callerUserId, gymId, PERMISSIONS.ROUTINES_READ);

    const routine = await this.routines.findById(gymId, routineId);
    if (!routine) {
      throw new RoutineNotFoundError(routineId);
    }

    const caller = await this.members.findByGymAndUserId(gymId, callerUserId);
    if (caller) {
      const callerRole = await this.permissionsRepo.findRoleSummary(caller.roleId);
      if (
        callerRole?.key === STUDENT_ROLE_KEY &&
        routine.scope === RoutineScope.PERSONAL &&
        routine.ownerMemberId !== caller.id
      ) {
        throw new RoutineNotFoundError(routineId);
      }
    }

    const items = await this.routineItems.listByRoutine(routine.id);
    return toRoutineView(routine, items);
  }
}
