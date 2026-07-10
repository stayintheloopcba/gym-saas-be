import { Inject, Injectable } from '@nestjs/common';
import { RoutineScope } from '../../../common/enums/routine-scope.enum';
import { MEMBER_REPOSITORY } from '../../members/domain/member.repository';
import type { MemberRepository } from '../../members/domain/member.repository';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { PERMISSION_REPOSITORY } from '../../permissions/domain/permission.repository';
import type { PermissionRepository } from '../../permissions/domain/permission.repository';
import { RoutineNotFoundError, RoutineOwnerMismatchError } from '../domain/routine.errors';
import { ROUTINE_REPOSITORY } from '../domain/routine.repository';
import type { RoutineRepository } from '../domain/routine.repository';

const STUDENT_ROLE_KEY = 'student';

@Injectable()
export class RemoveRoutineUseCase {
  constructor(
    @Inject(ROUTINE_REPOSITORY) private readonly routines: RoutineRepository,
    @Inject(MEMBER_REPOSITORY) private readonly members: MemberRepository,
    @Inject(PERMISSION_REPOSITORY) private readonly permissionsRepo: PermissionRepository,
    private readonly permissions: GymPermissionService,
  ) {}

  async execute(callerUserId: string, gymId: string, routineId: string): Promise<void> {
    await this.permissions.requirePermission(callerUserId, gymId, PERMISSIONS.ROUTINES_MANAGE);

    const routine = await this.routines.findById(gymId, routineId);
    if (!routine) {
      throw new RoutineNotFoundError(routineId);
    }

    const caller = await this.members.findByGymAndUserId(gymId, callerUserId);
    if (caller) {
      const callerRole = await this.permissionsRepo.findRoleSummary(caller.roleId);
      if (
        callerRole?.key === STUDENT_ROLE_KEY &&
        (routine.scope === RoutineScope.TEMPLATE || routine.ownerMemberId !== caller.id)
      ) {
        throw new RoutineOwnerMismatchError();
      }
    }

    await this.routines.softDelete(routineId);
  }
}
