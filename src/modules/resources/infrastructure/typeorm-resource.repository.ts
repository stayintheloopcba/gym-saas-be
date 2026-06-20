import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { applyOwnershipScope } from '../../permissions/ownership/apply-ownership-scope';
import { OwnershipContext } from '../../permissions/ownership/ownership-context';
import { Resource } from '../domain/resource.entity';
import {
  ListResourcesQuery,
  PaginatedResources,
  ResourceRepository,
  ResourceSortBy,
} from '../domain/resource.repository';

const SORT_COLUMNS: Record<ResourceSortBy, string> = {
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  name: 'name',
  status: 'status',
};

@Injectable()
export class TypeOrmResourceRepository implements ResourceRepository {
  constructor(@InjectRepository(Resource) private readonly repo: Repository<Resource>) {}

  findById(id: string, organizationId: string): Promise<Resource | null> {
    return this.repo.findOne({ where: { id, organizationId } });
  }

  async list(
    organizationId: string,
    query: ListResourcesQuery,
    ownership?: OwnershipContext,
  ): Promise<PaginatedResources> {
    const builder = this.repo
      .createQueryBuilder('resource')
      .where('resource.organization_id = :organizationId', { organizationId });

    if (ownership) {
      applyOwnershipScope(builder, 'resource', ownership);
    }

    const search = query.search?.trim();
    if (search) {
      builder.andWhere('(resource.name ILIKE :search OR resource.description ILIKE :search)', {
        search: `%${search}%`,
      });
    }
    if (query.status) {
      builder.andWhere('resource.status = :status', { status: query.status });
    }

    const [data, total] = await builder
      .orderBy(`resource.${SORT_COLUMNS[query.sortBy]}`, query.sortOrder === 'asc' ? 'ASC' : 'DESC')
      .addOrderBy('resource.id', 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    return { data, total };
  }

  save(resource: Resource): Promise<Resource> {
    return this.repo.save(resource);
  }

  async softDelete(id: string, organizationId: string): Promise<void> {
    await this.repo.softDelete({ id, organizationId });
  }
}
