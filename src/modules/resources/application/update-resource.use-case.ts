import { Inject, Injectable } from '@nestjs/common';
import { OrganizationPermissionService } from '../../permissions/application/organization-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { Resource } from '../domain/resource.entity';
import { ResourceNotFoundError } from '../domain/resource.errors';
import { RESOURCE_REPOSITORY } from '../domain/resource.repository';
import type { ResourceRepository } from '../domain/resource.repository';
import { ResourceStatus } from '../domain/resource-status.enum';

export interface UpdateResourceInput {
  callerUserId: string;
  organizationId: string;
  resourceId: string;
  name?: string;
  description?: string | null;
  status?: ResourceStatus;
}

@Injectable()
export class UpdateResourceUseCase {
  constructor(
    @Inject(RESOURCE_REPOSITORY) private readonly resources: ResourceRepository,
    private readonly permissions: OrganizationPermissionService,
  ) {}

  async execute(input: UpdateResourceInput): Promise<Resource> {
    await this.permissions.requirePermission(input.callerUserId, input.organizationId, PERMISSIONS.RESOURCES_UPDATE);

    const resource = await this.resources.findById(input.resourceId, input.organizationId);
    if (!resource) {
      throw new ResourceNotFoundError(input.resourceId);
    }

    if (input.name !== undefined) resource.name = input.name.trim();
    if (input.description !== undefined) resource.description = input.description?.trim() || undefined;
    if (input.status !== undefined) resource.status = input.status;
    return this.resources.save(resource);
  }
}
