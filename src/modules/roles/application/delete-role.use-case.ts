import { Inject, Injectable } from '@nestjs/common';
import { MEMBER_REPOSITORY } from '../../members/domain/member.repository';
import type { MemberRepository } from '../../members/domain/member.repository';
import { OwnerRoleProtectedError, RoleInUseError, RoleNotFoundError } from '../domain/role.errors';
import { ROLE_REPOSITORY } from '../domain/role.repository';
import type { RoleRepository } from '../domain/role.repository';

const OWNER_ROLE_KEY = 'owner';

/** Platform-admin only. Rechaza borrar `owner` o un rol referenciado por members. */
@Injectable()
export class DeleteRoleUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
    @Inject(MEMBER_REPOSITORY) private readonly members: MemberRepository,
  ) {}

  async execute(roleId: string): Promise<void> {
    const role = await this.roles.findById(roleId);
    if (!role) {
      throw new RoleNotFoundError(roleId);
    }
    if (role.key === OWNER_ROLE_KEY) {
      throw new OwnerRoleProtectedError();
    }

    const memberCount = await this.members.countByRole(roleId);
    if (memberCount > 0) {
      throw new RoleInUseError();
    }

    await this.roles.softDelete(roleId);
  }
}
