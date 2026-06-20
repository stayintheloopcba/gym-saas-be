import { Inject, Injectable } from '@nestjs/common';
import { OrganizationPermissionService } from '../../permissions/application/organization-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { OrganizationNotFoundError } from '../domain/organization.errors';
import { ORGANIZATION_REPOSITORY } from '../domain/organization.repository';
import type { OrganizationRepository } from '../domain/organization.repository';

/**
 * Soft-delete de una organización. Requiere rol `OWNER`. Tras el borrado el slug
 * queda libre (el índice único es parcial sobre `deleted_at IS NULL`).
 */
@Injectable()
export class DeleteOrganizationUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY) private readonly organizations: OrganizationRepository,
    private readonly permissions: OrganizationPermissionService,
  ) {}

  async execute(callerUserId: string, organizationId: string): Promise<void> {
    await this.permissions.requirePermission(callerUserId, organizationId, PERMISSIONS.ORGANIZATION_DELETE);

    const organization = await this.organizations.findById(organizationId);
    if (!organization) {
      throw new OrganizationNotFoundError(organizationId);
    }

    await this.organizations.softDelete(organizationId);
  }
}
