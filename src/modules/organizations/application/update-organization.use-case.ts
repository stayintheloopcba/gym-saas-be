import { Inject, Injectable } from '@nestjs/common';
import { OrganizationPermissionService } from '../../permissions/application/organization-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { Organization } from '../domain/organization.entity';
import { OrganizationNotFoundError } from '../domain/organization.errors';
import { ORGANIZATION_REPOSITORY } from '../domain/organization.repository';
import type { OrganizationRepository } from '../domain/organization.repository';

/** Campos editables de una organización (parcial). */
export interface UpdateOrganizationCommand {
  name?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
}

/**
 * Actualiza nombre y/o branding de una organización. Requiere `ORGANIZATION_UPDATE`
 * del llamador. Aplica solo los campos provistos (update parcial). Reemplaza al
 * antiguo `RenameOrganizationUseCase`.
 */
@Injectable()
export class UpdateOrganizationUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY) private readonly organizations: OrganizationRepository,
    private readonly permissions: OrganizationPermissionService,
  ) {}

  async execute(callerUserId: string, organizationId: string, patch: UpdateOrganizationCommand): Promise<Organization> {
    await this.permissions.requirePermission(callerUserId, organizationId, PERMISSIONS.ORGANIZATION_UPDATE);

    const organization = await this.organizations.findById(organizationId);
    if (!organization) {
      throw new OrganizationNotFoundError(organizationId);
    }

    if (patch.name !== undefined) {
      organization.name = patch.name.trim();
    }
    if (patch.primaryColor !== undefined) {
      organization.primaryColor = patch.primaryColor;
    }
    if (patch.secondaryColor !== undefined) {
      organization.secondaryColor = patch.secondaryColor;
    }
    if (patch.fontFamily !== undefined) {
      organization.fontFamily = patch.fontFamily;
    }

    return this.organizations.save(organization);
  }
}
