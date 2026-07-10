import { Inject, Injectable } from '@nestjs/common';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { DuplicateMemberError } from '../domain/member.errors';
import { Member } from '../domain/member.entity';
import { MemberStatus } from '../domain/member-status.enum';
import { MEMBER_REPOSITORY } from '../domain/member.repository';
import type { MemberRepository } from '../domain/member.repository';

export interface CreateMemberCommand {
  callerUserId: string;
  gymId: string;
  roleId: string;
  branchId?: string;
  firstName: string;
  lastName: string;
  documentId?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  consents?: Record<string, unknown>;
}

/**
 * Registra un `Member` sin cuenta de acceso (`userId` siempre `null` al
 * crear: el login se otorga después vía grant-portal-access). 409 si ya
 * existe un Member activo con el mismo `documentId` en el gym.
 */
@Injectable()
export class CreateMemberUseCase {
  constructor(
    @Inject(MEMBER_REPOSITORY) private readonly members: MemberRepository,
    private readonly permissions: GymPermissionService,
  ) {}

  async execute(command: CreateMemberCommand): Promise<Member> {
    await this.permissions.requirePermission(command.callerUserId, command.gymId, PERMISSIONS.MEMBERS_CREATE);

    if (command.documentId) {
      const existing = await this.members.findByGymAndDocumentId(command.gymId, command.documentId);
      if (existing) {
        throw new DuplicateMemberError('documentId');
      }
    }

    const member = new Member();
    member.gymId = command.gymId;
    member.userId = null;
    member.roleId = command.roleId;
    member.branchId = command.branchId ?? null;
    member.firstName = command.firstName;
    member.lastName = command.lastName;
    member.documentId = command.documentId ?? null;
    member.email = command.email ?? null;
    member.phone = command.phone ?? null;
    member.birthDate = command.birthDate ?? null;
    member.photoUrl = null;
    member.emergencyContactName = command.emergencyContactName ?? null;
    member.emergencyContactPhone = command.emergencyContactPhone ?? null;
    member.status = MemberStatus.ACTIVE;
    member.consents = command.consents ?? null;

    return this.members.save(member);
  }
}
