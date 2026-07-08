import { Inject, Injectable } from '@nestjs/common';
import { OrganizationPermissionService } from '../../permissions/application/organization-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { PERMISSION_REPOSITORY } from '../../permissions/domain/permission.repository';
import type { PermissionRepository } from '../../permissions/domain/permission.repository';
import { RoleSummary } from '../../permissions/domain/role-summary';
import { FindUserByIdUseCase } from '../../users/application/find-user.use-cases';
import { toPublicProfile, UserPublicProfile } from '../../users/application/user-public-profile';
import { MEMBERSHIP_REPOSITORY } from '../domain/membership.repository';
import type { MembershipRepository } from '../domain/membership.repository';

/** Un miembro de la organización: su perfil público + su rol del catálogo. */
export interface OrganizationMember {
  membershipId: string;
  role: RoleSummary;
  user: UserPublicProfile;
}

/**
 * Lista los miembros activos de una organización con el perfil público de cada
 * uno y su rol. El llamador debe ser miembro de la organización.
 */
@Injectable()
export class ListOrganizationMembersUseCase {
  constructor(
    @Inject(MEMBERSHIP_REPOSITORY) private readonly memberships: MembershipRepository,
    @Inject(PERMISSION_REPOSITORY) private readonly permissionsRepo: PermissionRepository,
    private readonly findUserById: FindUserByIdUseCase,
    private readonly permissions: OrganizationPermissionService,
  ) {}

  async execute(callerUserId: string, organizationId: string): Promise<OrganizationMember[]> {
    await this.permissions.requirePermission(callerUserId, organizationId, PERMISSIONS.MEMBERS_READ);

    const memberships = await this.memberships.findByOrg(organizationId);

    const result: OrganizationMember[] = [];
    for (const membership of memberships) {
      const [user, role] = await Promise.all([
        this.findUserById.execute(membership.userId),
        this.permissionsRepo.findRoleSummary(membership.roleId),
      ]);
      if (user && role) {
        result.push({ membershipId: membership.id, role, user: toPublicProfile(user) });
      }
    }
    return result;
  }
}
