import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MembershipRole } from '../../../common/enums/membership-role.enum';
import { Membership } from '../../memberships/domain/membership.entity';
import { OrgUnitOfWork } from '../application/org-unit-of-work.port';
import { Organization } from '../domain/organization.entity';

/**
 * Implementación TypeORM del `OrgUnitOfWork`: persiste la organización y su
 * membresía `OWNER` dentro de una única `DataSource.transaction`, de modo que
 * nunca quede una org sin owner (Decision 5 del design).
 */
@Injectable()
export class TypeOrmOrgUnitOfWork implements OrgUnitOfWork {
  constructor(private readonly dataSource: DataSource) {}

  createOrganizationWithOwner(organization: Organization, ownerUserId: string): Promise<Organization> {
    return this.dataSource.transaction(async (manager) => {
      const savedOrg = await manager.getRepository(Organization).save(organization);

      const ownership = new Membership();
      ownership.userId = ownerUserId;
      ownership.organizationId = savedOrg.id;
      ownership.role = MembershipRole.OWNER;
      ownership.roleId = null;
      await manager.getRepository(Membership).save(ownership);

      return savedOrg;
    });
  }
}
