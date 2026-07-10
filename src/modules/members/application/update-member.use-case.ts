import { Inject, Injectable } from '@nestjs/common';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { PERMISSION_REPOSITORY } from '../../permissions/domain/permission.repository';
import type { PermissionRepository } from '../../permissions/domain/permission.repository';
import { DuplicateMemberError, MemberNotFoundError } from '../domain/member.errors';
import { Member } from '../domain/member.entity';
import { MEMBER_REPOSITORY } from '../domain/member.repository';
import type { MemberRepository } from '../domain/member.repository';
import { MemberView, toMemberView } from '../interfaces/member.view';

export interface UpdateMemberCommand {
  callerUserId: string;
  gymId: string;
  memberId: string;
  branchId?: string;
  firstName?: string;
  lastName?: string;
  documentId?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  consents?: Record<string, unknown>;
}

/** Actualiza los datos personales de un `Member`. 409 si el nuevo `documentId` ya está en uso. */
@Injectable()
export class UpdateMemberUseCase {
  constructor(
    @Inject(MEMBER_REPOSITORY) private readonly members: MemberRepository,
    @Inject(PERMISSION_REPOSITORY) private readonly permissionsRepo: PermissionRepository,
    private readonly permissions: GymPermissionService,
  ) {}

  async execute(command: UpdateMemberCommand): Promise<MemberView> {
    await this.permissions.requirePermission(command.callerUserId, command.gymId, PERMISSIONS.MEMBERS_UPDATE);

    const member = await this.members.findById(command.gymId, command.memberId);
    if (!member) {
      throw new MemberNotFoundError(command.memberId);
    }

    if (command.documentId && command.documentId !== member.documentId) {
      const existing = await this.members.findByGymAndDocumentId(command.gymId, command.documentId);
      if (existing && existing.id !== member.id) {
        throw new DuplicateMemberError('documentId');
      }
    }

    this.applyPatch(member, command);

    const saved = await this.members.save(member);
    const role = await this.permissionsRepo.findRoleSummary(saved.roleId);
    if (!role) {
      throw new MemberNotFoundError(command.memberId);
    }
    return toMemberView(saved, role);
  }

  /** Copia solo los campos provistos (`undefined` = sin cambios) del comando al `Member`. */
  private applyPatch(member: Member, command: UpdateMemberCommand): void {
    const patchable: (keyof UpdateMemberCommand)[] = [
      'branchId',
      'firstName',
      'lastName',
      'documentId',
      'email',
      'phone',
      'birthDate',
      'emergencyContactName',
      'emergencyContactPhone',
      'consents',
    ];
    for (const field of patchable) {
      if (command[field] !== undefined) {
        (member as unknown as Record<string, unknown>)[field] = command[field];
      }
    }
  }
}
