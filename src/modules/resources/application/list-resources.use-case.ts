import { Inject, Injectable } from '@nestjs/common';
import { OrganizationPermissionService } from '../../permissions/application/organization-permission.service';
import { OwnershipContextService } from '../../permissions/application/ownership-context.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { RESOURCE_REPOSITORY } from '../domain/resource.repository';
import type { ListResourcesQuery, PaginatedResources, ResourceRepository } from '../domain/resource.repository';

@Injectable()
export class ListResourcesUseCase {
  constructor(
    @Inject(RESOURCE_REPOSITORY) private readonly resources: ResourceRepository,
    private readonly permissions: OrganizationPermissionService,
    private readonly ownership: OwnershipContextService,
  ) {}

  async execute(callerUserId: string, organizationId: string, query: ListResourcesQuery): Promise<PaginatedResources> {
    await this.permissions.requirePermission(callerUserId, organizationId, PERMISSIONS.RESOURCES_READ);
    const ownership = await this.ownership.build(callerUserId, organizationId);
    return this.resources.list(organizationId, query, ownership ?? undefined);
  }
}
