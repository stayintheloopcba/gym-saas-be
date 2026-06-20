import { Inject, Injectable } from '@nestjs/common';
import { MembershipRole } from '../../../common/enums/membership-role.enum';
import { MEMBERSHIP_REPOSITORY } from '../../memberships/domain/membership.repository';
import type { MembershipRepository } from '../../memberships/domain/membership.repository';
import { Organization } from '../domain/organization.entity';
import { ORGANIZATION_REPOSITORY } from '../domain/organization.repository';
import type { OrganizationRepository } from '../domain/organization.repository';

/** Una organización del usuario junto con el rol que tiene en ella. */
export interface MyOrganization {
  organization: Organization;
  role: MembershipRole;
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
  ) {}

  async execute(callerUserId: string): Promise<MyOrganization[]> {
    const memberships = await this.memberships.findByUser(callerUserId);

    const result: MyOrganization[] = [];
    for (const membership of memberships) {
      const organization = await this.organizations.findById(membership.organizationId);
      if (organization) {
        result.push({ organization, role: membership.role });
      }
    }
    return result;
  }
}
