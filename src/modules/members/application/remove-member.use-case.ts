import { Inject, Injectable } from '@nestjs/common';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { MemberNotFoundError } from '../domain/member.errors';
import { MEMBER_REPOSITORY } from '../domain/member.repository';
import type { MemberRepository } from '../domain/member.repository';

/**
 * Elimina (soft delete) un `Member` del gym. La protección de "único owner"
 * se traslada desde `memberships` cuando ese módulo se elimina (ver tarea 8).
 */
@Injectable()
export class RemoveMemberUseCase {
  constructor(
    @Inject(MEMBER_REPOSITORY) private readonly members: MemberRepository,
    private readonly permissions: GymPermissionService,
  ) {}

  async execute(callerUserId: string, gymId: string, memberId: string): Promise<void> {
    await this.permissions.requirePermission(callerUserId, gymId, PERMISSIONS.MEMBERS_REMOVE);

    const member = await this.members.findById(gymId, memberId);
    if (!member) {
      throw new MemberNotFoundError(memberId);
    }

    await this.members.softDelete(member.id);
  }
}
