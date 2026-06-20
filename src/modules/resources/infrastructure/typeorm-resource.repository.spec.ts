import { Repository } from 'typeorm';
import { Resource } from '../domain/resource.entity';
import { ListResourcesQuery } from '../domain/resource.repository';
import { ResourceStatus } from '../domain/resource-status.enum';
import { TypeOrmResourceRepository } from './typeorm-resource.repository';

describe('TypeOrmResourceRepository', () => {
  let typeorm: { findOne: jest.Mock; save: jest.Mock; softDelete: jest.Mock; createQueryBuilder: jest.Mock };
  let builder: Record<string, jest.Mock>;
  let repository: TypeOrmResourceRepository;

  beforeEach(() => {
    builder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    };
    typeorm = {
      findOne: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
      createQueryBuilder: jest.fn(() => builder),
    };
    repository = new TypeOrmResourceRepository(typeorm as unknown as Repository<Resource>);
  });

  it('finds a resource only inside the supplied organization', async () => {
    typeorm.findOne.mockResolvedValue(null);

    await repository.findById('resource-1', 'org-1');

    expect(typeorm.findOne).toHaveBeenCalledWith({
      where: { id: 'resource-1', organizationId: 'org-1' },
    });
  });

  it('always scopes paginated queries and applies validated filters', async () => {
    const query: ListResourcesQuery = {
      page: 2,
      limit: 20,
      search: '  test  ',
      status: ResourceStatus.ACTIVE,
      sortBy: 'name',
      sortOrder: 'asc',
    };
    builder.getManyAndCount.mockResolvedValue([[], 0]);

    await repository.list('org-1', query);

    expect(builder.where).toHaveBeenCalledWith('resource.organization_id = :organizationId', {
      organizationId: 'org-1',
    });
    expect(builder.andWhere).toHaveBeenCalledWith(
      '(resource.name ILIKE :search OR resource.description ILIKE :search)',
      { search: '%test%' },
    );
    expect(builder.andWhere).toHaveBeenCalledWith('resource.status = :status', {
      status: ResourceStatus.ACTIVE,
    });
    expect(builder.orderBy).toHaveBeenCalledWith('resource.name', 'ASC');
    expect(builder.skip).toHaveBeenCalledWith(20);
    expect(builder.take).toHaveBeenCalledWith(20);
  });

  it('soft-deletes only when resource and organization both match', async () => {
    await repository.softDelete('resource-1', 'org-1');

    expect(typeorm.softDelete).toHaveBeenCalledWith({
      id: 'resource-1',
      organizationId: 'org-1',
    });
  });
});
