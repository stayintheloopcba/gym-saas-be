import { Resource } from '../domain/resource.entity';
import { PaginatedResources } from '../domain/resource.repository';
import { ResourceStatus } from '../domain/resource-status.enum';

export interface ResourceView {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  status: ResourceStatus;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface PaginatedResourceView {
  data: ResourceView[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const toResourceView = (resource: Resource): ResourceView => ({
  id: resource.id,
  organizationId: resource.organizationId,
  name: resource.name,
  description: resource.description ?? null,
  status: resource.status,
  createdAt: resource.createdAt,
  updatedAt: resource.updatedAt ?? null,
});

export const toPaginatedResourceView = (
  result: PaginatedResources,
  page: number,
  limit: number,
): PaginatedResourceView => ({
  data: result.data.map(toResourceView),
  meta: {
    page,
    limit,
    total: result.total,
    totalPages: Math.ceil(result.total / limit),
  },
});
