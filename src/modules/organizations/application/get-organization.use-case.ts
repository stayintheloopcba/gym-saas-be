import { Inject, Injectable } from '@nestjs/common';
import { OrganizationPermissionService } from '../../permissions/application/organization-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { Organization } from '../domain/organization.entity';
import { OrganizationNotFoundError } from '../domain/organization.errors';
import { ORGANIZATION_REPOSITORY } from '../domain/organization.repository';
import type { OrganizationRepository } from '../domain/organization.repository';

/**
 * Lee una organización por id. El llamador debe ser miembro activo: si no lo es,
 * El servicio de permisos lanza 403 (no se revela la existencia de la org).
 */
@Injectable()
export class GetOrganizationUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY) private readonly organizations: OrganizationRepository,
    private readonly permissions: OrganizationPermissionService,
  ) {}

  async execute(callerUserId: string, organizationId: string): Promise<Organization> {
    await this.permissions.requirePermission(callerUserId, organizationId, PERMISSIONS.ORGANIZATION_READ);

    const organization = await this.organizations.findById(organizationId);
    if (!organization) {
      throw new OrganizationNotFoundError(organizationId);
    }
    return organization;
  }
}
