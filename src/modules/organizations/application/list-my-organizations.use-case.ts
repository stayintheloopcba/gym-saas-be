import { Inject, Injectable } from '@nestjs/common';
import { MEMBERSHIP_REPOSITORY } from '../../memberships/domain/membership.repository';
import type { MembershipRepository } from '../../memberships/domain/membership.repository';
import { PERMISSION_REPOSITORY } from '../../permissions/domain/permission.repository';
import type { PermissionRepository } from '../../permissions/domain/permission.repository';
import { RoleSummary } from '../../permissions/domain/role-summary';
import { Organization } from '../domain/organization.entity';
import { ORGANIZATION_REPOSITORY } from '../domain/organization.repository';
import type { OrganizationRepository } from '../domain/organization.repository';

/** Una organización del usuario junto con su rol del catálogo en ella. */
export interface MyOrganization {
  organization: Organization;
  role: RoleSummary;
}

/**
 * Lista las organizaciones donde el usuario tiene una membresía activa, con su
 * rol en cada una. Las orgs eliminadas se omiten (el `findById` no las devuelve).
 */
@Injectable()
export class ListMyOrganizationsUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY) private readonly organizations: OrganizationRepository,
    @Inject(MEMBERSHIP_REPOSITORY) private readonly memberships: MembershipRepository,
    @Inject(PERMISSION_REPOSITORY) private readonly permissionsRepo: PermissionRepository,
  ) {}

  async execute(callerUserId: string): Promise<MyOrganization[]> {
    const memberships = await this.memberships.findByUser(callerUserId);

    const result: MyOrganization[] = [];
    for (const membership of memberships) {
      const [organization, role] = await Promise.all([
        this.organizations.findById(membership.organizationId),
        this.permissionsRepo.findRoleSummary(membership.roleId),
      ]);
      if (organization && role) {
        result.push({ organization, role });
      }
    }
    return result;
  }
}
