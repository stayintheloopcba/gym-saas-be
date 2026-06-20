import { Inject, Injectable } from '@nestjs/common';
import { OrganizationPermissionService } from '../../permissions/application/organization-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { ResourceNotFoundError } from '../domain/resource.errors';
import { RESOURCE_REPOSITORY } from '../domain/resource.repository';
import type { ResourceRepository } from '../domain/resource.repository';

@Injectable()
export class DeleteResourceUseCase {
  constructor(
    @Inject(RESOURCE_REPOSITORY) private readonly resources: ResourceRepository,
    private readonly permissions: OrganizationPermissionService,
  ) {}

  async execute(callerUserId: string, organizationId: string, resourceId: string): Promise<void> {
    await this.permissions.requirePermission(callerUserId, organizationId, PERMISSIONS.RESOURCES_DELETE);

    const resource = await this.resources.findById(resourceId, organizationId);
    if (!resource) {
      throw new ResourceNotFoundError(resourceId);
    }
    await this.resources.softDelete(resourceId, organizationId);
  }
}
