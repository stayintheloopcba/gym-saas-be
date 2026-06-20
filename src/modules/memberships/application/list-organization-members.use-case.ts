import { Inject, Injectable } from '@nestjs/common';
import { MembershipRole } from '../../../common/enums/membership-role.enum';
import { FindUserByIdUseCase } from '../../users/application/find-user.use-cases';
import { toPublicProfile, UserPublicProfile } from '../../users/application/user-public-profile';
import { MEMBERSHIP_REPOSITORY } from '../domain/membership.repository';
import type { MembershipRepository } from '../domain/membership.repository';
import { OrganizationPermissionService } from '../../permissions/application/organization-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';

/** Un miembro de la organización: su perfil público + el rol e id de membresía. */
export interface OrganizationMember {
  membershipId: string;
  role: MembershipRole;
  customRoleId: string | null;
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
    private readonly findUserById: FindUserByIdUseCase,
    private readonly permissions: OrganizationPermissionService,
  ) {}

  async execute(callerUserId: string, organizationId: string): Promise<OrganizationMember[]> {
    await this.permissions.requirePermission(callerUserId, organizationId, PERMISSIONS.MEMBERS_READ);

    const memberships = await this.memberships.findByOrg(organizationId);

    const result: OrganizationMember[] = [];
    for (const membership of memberships) {
      const user = await this.findUserById.execute(membership.userId);
      if (user) {
        result.push({
          membershipId: membership.id,
          role: membership.role,
          customRoleId: membership.roleId ?? null,
          user: toPublicProfile(user),
        });
      }
    }
    return result;
  }
}
