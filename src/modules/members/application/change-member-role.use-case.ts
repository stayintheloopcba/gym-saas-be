import { Inject, Injectable } from '@nestjs/common';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { PERMISSION_REPOSITORY } from '../../permissions/domain/permission.repository';
import type { PermissionRepository } from '../../permissions/domain/permission.repository';
import {
  CannotChangeOwnRoleError,
  MemberNotFoundError,
  OwnerRoleNotAssignableError,
  SoleOwnerError,
  UnknownRoleError,
} from '../domain/member.errors';
import { MEMBER_REPOSITORY } from '../domain/member.repository';
import type { MemberRepository } from '../domain/member.repository';
import { MemberView, toMemberView } from '../interfaces/member.view';

const OWNER_ROLE_KEY = 'owner';

export interface ChangeMemberRoleCommand {
  callerUserId: string;
  gymId: string;
  memberId: string;
  roleId: string;
}

/**
 * Cambia el rol (del catálogo) de un `Member` dentro de un gym.
 *
 * Invariantes de negocio que protege:
 * - El llamador necesita el permiso `members:update_role`.
 * - Nadie puede cambiar su propio rol (`CannotChangeOwnRoleError`).
 * - El `roleId` debe existir en el catálogo (`UnknownRoleError`).
 * - El rol `owner` no es asignable por esta vía (`OwnerRoleNotAssignableError`):
 *   solo se otorga automáticamente al crear el gym.
 * - No se puede degradar al único `owner` (`SoleOwnerError`).
 */
@Injectable()
export class ChangeMemberRoleUseCase {
  constructor(
    @Inject(MEMBER_REPOSITORY) private readonly members: MemberRepository,
    @Inject(PERMISSION_REPOSITORY) private readonly permissionsRepo: PermissionRepository,
    private readonly permissions: GymPermissionService,
  ) {}

  async execute(command: ChangeMemberRoleCommand): Promise<MemberView> {
    const { callerUserId, gymId, memberId, roleId } = command;

    await this.permissions.requirePermission(callerUserId, gymId, PERMISSIONS.MEMBERS_UPDATE_ROLE);

    const target = await this.members.findById(gymId, memberId);
    if (!target) {
      throw new MemberNotFoundError(memberId);
    }
    if (target.userId === callerUserId) {
      throw new CannotChangeOwnRoleError();
    }

    const role = await this.permissionsRepo.findRoleSummary(roleId);
    if (!role) {
      throw new UnknownRoleError(roleId);
    }
    if (role.key === OWNER_ROLE_KEY) {
      throw new OwnerRoleNotAssignableError();
    }

    if (target.roleId === role.id) {
      return toMemberView(target, role);
    }

    const currentRole = await this.permissionsRepo.findRoleSummary(target.roleId);
    if (currentRole?.key === OWNER_ROLE_KEY) {
      const owners = await this.members.countByRoleInGym(gymId, target.roleId);
      if (owners <= 1) {
        throw new SoleOwnerError();
      }
    }

    target.roleId = role.id;
    const saved = await this.members.save(target);
    return toMemberView(saved, role);
  }
}
