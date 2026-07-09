import { Inject, Injectable } from '@nestjs/common';
import { MEMBERSHIP_REPOSITORY } from '../../memberships/domain/membership.repository';
import type { MembershipRepository } from '../../memberships/domain/membership.repository';
import { OwnerRoleProtectedError, RoleInUseError, RoleNotFoundError } from '../domain/role.errors';
import { ROLE_REPOSITORY } from '../domain/role.repository';
import type { RoleRepository } from '../domain/role.repository';

const OWNER_ROLE_KEY = 'owner';

/** Platform-admin only. Rechaza borrar `owner` o un rol referenciado por miembros. */
@Injectable()
export class DeleteRoleUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
    @Inject(MEMBERSHIP_REPOSITORY) private readonly memberships: MembershipRepository,
  ) {}

  async execute(roleId: string): Promise<void> {
    const role = await this.roles.findById(roleId);
    if (!role) {
      throw new RoleNotFoundError(roleId);
    }
    if (role.key === OWNER_ROLE_KEY) {
      throw new OwnerRoleProtectedError();
    }

    const membershipCount = await this.memberships.countByRole(roleId);
    if (membershipCount > 0) {
      throw new RoleInUseError();
    }

    await this.roles.softDelete(roleId);
  }
}
