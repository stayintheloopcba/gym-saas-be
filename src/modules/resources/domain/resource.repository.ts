import { OwnershipContext } from '../../permissions/ownership/ownership-context';
import { Resource } from './resource.entity';
import { ResourceStatus } from './resource-status.enum';

export const RESOURCE_REPOSITORY = Symbol('RESOURCE_REPOSITORY');

export const RESOURCE_SORT_FIELDS = ['createdAt', 'updatedAt', 'name', 'status'] as const;
export type ResourceSortBy = (typeof RESOURCE_SORT_FIELDS)[number];
export type ResourceSortOrder = 'asc' | 'desc';

export interface ListResourcesQuery {
  page: number;
  limit: number;
  search?: string;
  status?: ResourceStatus;
  sortBy: ResourceSortBy;
  sortOrder: ResourceSortOrder;
}

export interface PaginatedResources {
  data: Resource[];
  total: number;
}

export interface ResourceRepository {
  findById(id: string, organizationId: string): Promise<Resource | null>;
  /** `ownership` acota el listado al alcance del usuario (SELF → solo los propios). */
  list(organizationId: string, query: ListResourcesQuery, ownership?: OwnershipContext): Promise<PaginatedResources>;
  save(resource: Resource): Promise<Resource>;
  softDelete(id: string, organizationId: string): Promise<void>;
}
