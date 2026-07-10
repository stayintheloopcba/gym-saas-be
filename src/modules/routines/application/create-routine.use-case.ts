import { Inject, Injectable } from '@nestjs/common';
import { RoutineScope } from '../../../common/enums/routine-scope.enum';
import { MemberNotFoundError } from '../../members/domain/member.errors';
import { MEMBER_REPOSITORY } from '../../members/domain/member.repository';
import type { MemberRepository } from '../../members/domain/member.repository';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { PERMISSION_REPOSITORY } from '../../permissions/domain/permission.repository';
import type { PermissionRepository } from '../../permissions/domain/permission.repository';
import { RoutineItemInput, ROUTINE_ITEM_REPOSITORY } from '../domain/routine-item.repository';
import type { RoutineItemRepository } from '../domain/routine-item.repository';
import { Routine } from '../domain/routine.entity';
import {
  RoutineOwnerMismatchError,
  RoutineOwnerNotAllowedError,
  RoutineOwnerRequiredError,
} from '../domain/routine.errors';
import { ROUTINE_REPOSITORY } from '../domain/routine.repository';
import type { RoutineRepository } from '../domain/routine.repository';
import { RoutineView, toRoutineView } from '../interfaces/routine.view';

const STUDENT_ROLE_KEY = 'student';

export interface CreateRoutineCommand {
  callerUserId: string;
  gymId: string;
  scope: RoutineScope;
  ownerMemberId?: string;
  name: string;
  notes?: string;
  active?: boolean;
  items: RoutineItemInput[];
}

/**
 * Crea una `Routine`. Reglas de scope (tarea 19): `TEMPLATE` no admite
 * owner; `PERSONAL` lo requiere. Un caller con rol `student` solo puede
 * crear rutinas personales propias (`ownerMemberId` = su propio member).
 * Owner/admin/instructor no tienen esa restricción (ver nota de
 * implementación: `hierarchyLevel` no distingue instructor de student, así
 * que la regla se resuelve por `role.key`, no por la maquinaria genérica de
 * ownership).
 */
@Injectable()
export class CreateRoutineUseCase {
  constructor(
    @Inject(ROUTINE_REPOSITORY) private readonly routines: RoutineRepository,
    @Inject(ROUTINE_ITEM_REPOSITORY) private readonly routineItems: RoutineItemRepository,
    @Inject(MEMBER_REPOSITORY) private readonly members: MemberRepository,
    @Inject(PERMISSION_REPOSITORY) private readonly permissionsRepo: PermissionRepository,
    private readonly permissions: GymPermissionService,
  ) {}

  async execute(command: CreateRoutineCommand): Promise<RoutineView> {
    await this.permissions.requirePermission(command.callerUserId, command.gymId, PERMISSIONS.ROUTINES_MANAGE);

    const caller = await this.members.findByGymAndUserId(command.gymId, command.callerUserId);
    if (!caller) {
      throw new MemberNotFoundError(command.callerUserId);
    }
    const callerRole = await this.permissionsRepo.findRoleSummary(caller.roleId);

    if (command.scope === RoutineScope.TEMPLATE) {
      if (command.ownerMemberId) {
        throw new RoutineOwnerNotAllowedError();
      }
    } else {
      if (!command.ownerMemberId) {
        throw new RoutineOwnerRequiredError();
      }
      if (callerRole?.key === STUDENT_ROLE_KEY && command.ownerMemberId !== caller.id) {
        throw new RoutineOwnerMismatchError();
      }
    }

    const routine = new Routine();
    routine.gymId = command.gymId;
    routine.scope = command.scope;
    routine.ownerMemberId = command.ownerMemberId ?? null;
    routine.createdByMemberId = caller.id;
    routine.name = command.name;
    routine.notes = command.notes ?? null;
    routine.active = command.active ?? true;

    const saved = await this.routines.save(routine);
    const items = await this.routineItems.replaceSet(command.gymId, saved.id, command.items);

    return toRoutineView(saved, items);
  }
}
