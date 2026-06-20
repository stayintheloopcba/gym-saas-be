import { Inject, Injectable } from '@nestjs/common';
import { OrganizationPermissionService } from '../../permissions/application/organization-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { Resource } from '../domain/resource.entity';
import { RESOURCE_REPOSITORY } from '../domain/resource.repository';
import type { ResourceRepository } from '../domain/resource.repository';
import { ResourceStatus } from '../domain/resource-status.enum';

export interface CreateResourceInput {
  callerUserId: string;
  organizationId: string;
  name: string;
  description?: string;
  status?: ResourceStatus;
}

@Injectable()
export class CreateResourceUseCase {
  constructor(
    @Inject(RESOURCE_REPOSITORY) private readonly resources: ResourceRepository,
    private readonly permissions: OrganizationPermissionService,
  ) {}

  async execute(input: CreateResourceInput): Promise<Resource> {
    await this.permissions.requirePermission(input.callerUserId, input.organizationId, PERMISSIONS.RESOURCES_CREATE);

    const resource = Object.assign(new Resource(), {
      organizationId: input.organizationId,
      name: input.name.trim(),
      description: input.description?.trim() || undefined,
      status: input.status ?? ResourceStatus.ACTIVE,
    });
    return this.resources.save(resource);
  }
}
