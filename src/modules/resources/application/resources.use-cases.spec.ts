import { OrganizationPermissionService } from '../../permissions/application/organization-permission.service';
import { PermissionDeniedError } from '../../permissions/domain/permission.errors';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { Resource } from '../domain/resource.entity';
import { ResourceNotFoundError } from '../domain/resource.errors';
import { ListResourcesQuery, ResourceRepository } from '../domain/resource.repository';
import { ResourceStatus } from '../domain/resource-status.enum';
import { CreateResourceUseCase } from './create-resource.use-case';
import { DeleteResourceUseCase } from './delete-resource.use-case';
import { GetResourceUseCase } from './get-resource.use-case';
import { OwnershipContextService } from '../../permissions/application/ownership-context.service';
import { ListResourcesUseCase } from './list-resources.use-case';
import { UpdateResourceUseCase } from './update-resource.use-case';

const USER_ID = 'user-1';
const ORGANIZATION_ID = 'org-1';
const RESOURCE_ID = 'resource-1';

const resource = (): Resource =>
  Object.assign(new Resource(), {
    id: RESOURCE_ID,
    organizationId: ORGANIZATION_ID,
    name: 'Resource',
    status: ResourceStatus.ACTIVE,
  });

describe('Resource use cases', () => {
  let resources: jest.Mocked<ResourceRepository>;
  let permissions: { requirePermission: jest.Mock };

  beforeEach(() => {
    resources = {
      findById: jest.fn(),
      list: jest.fn(),
      save: jest.fn((value: Resource) => Promise.resolve(value)),
      softDelete: jest.fn(),
    };
    permissions = { requirePermission: jest.fn() };
  });

  it('creates a resource scoped to the organization after checking permission', async () => {
    const useCase = new CreateResourceUseCase(resources, permissions as unknown as OrganizationPermissionService);

    const created = await useCase.execute({
      callerUserId: USER_ID,
      organizationId: ORGANIZATION_ID,
      name: '  Example  ',
      description: '  Description  ',
    });

    expect(permissions.requirePermission).toHaveBeenCalledWith(USER_ID, ORGANIZATION_ID, PERMISSIONS.RESOURCES_CREATE);
    expect(created).toMatchObject({
      organizationId: ORGANIZATION_ID,
      name: 'Example',
      description: 'Description',
      status: ResourceStatus.ACTIVE,
    });
  });

  it('lists only through the requested organization scope', async () => {
    const query: ListResourcesQuery = {
      page: 2,
      limit: 10,
      search: 'example',
      status: ResourceStatus.ACTIVE,
      sortBy: 'name',
      sortOrder: 'asc',
    };
    resources.list.mockResolvedValue({ data: [], total: 0 });
    const ownershipContext = { userId: USER_ID, organizationId: ORGANIZATION_ID, hierarchyLevel: 5 };
    const ownership = { build: jest.fn().mockResolvedValue(ownershipContext) };
    const useCase = new ListResourcesUseCase(
      resources,
      permissions as unknown as OrganizationPermissionService,
      ownership as unknown as OwnershipContextService,
    );

    await useCase.execute(USER_ID, ORGANIZATION_ID, query);

    expect(resources.list).toHaveBeenCalledWith(ORGANIZATION_ID, query, ownershipContext);
  });

  it('does not return a resource that is absent from the organization', async () => {
    resources.findById.mockResolvedValue(null);
    const useCase = new GetResourceUseCase(resources, permissions as unknown as OrganizationPermissionService);

    await expect(useCase.execute(USER_ID, ORGANIZATION_ID, RESOURCE_ID)).rejects.toBeInstanceOf(ResourceNotFoundError);
    expect(resources.findById).toHaveBeenCalledWith(RESOURCE_ID, ORGANIZATION_ID);
  });

  it('updates only the organization-scoped resource', async () => {
    resources.findById.mockResolvedValue(resource());
    const useCase = new UpdateResourceUseCase(resources, permissions as unknown as OrganizationPermissionService);

    const updated = await useCase.execute({
      callerUserId: USER_ID,
      organizationId: ORGANIZATION_ID,
      resourceId: RESOURCE_ID,
      name: '  Updated  ',
      description: null,
      status: ResourceStatus.INACTIVE,
    });

    expect(updated).toMatchObject({
      name: 'Updated',
      description: undefined,
      status: ResourceStatus.INACTIVE,
    });
    expect(resources.findById).toHaveBeenCalledWith(RESOURCE_ID, ORGANIZATION_ID);
  });

  it('soft-deletes using both resource and organization identifiers', async () => {
    resources.findById.mockResolvedValue(resource());
    const useCase = new DeleteResourceUseCase(resources, permissions as unknown as OrganizationPermissionService);

    await useCase.execute(USER_ID, ORGANIZATION_ID, RESOURCE_ID);

    expect(resources.softDelete).toHaveBeenCalledWith(RESOURCE_ID, ORGANIZATION_ID);
  });

  it('stops before persistence when permission is denied', async () => {
    permissions.requirePermission.mockRejectedValue(new PermissionDeniedError());
    const useCase = new CreateResourceUseCase(resources, permissions as unknown as OrganizationPermissionService);

    await expect(
      useCase.execute({
        callerUserId: USER_ID,
        organizationId: ORGANIZATION_ID,
        name: 'Denied',
      }),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
    expect(resources.save).not.toHaveBeenCalled();
  });
});
