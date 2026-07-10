import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { Branch } from '../domain/branch.entity';
import { BranchRepository } from '../domain/branch.repository';
import { ListBranchesUseCase } from './list-branches.use-case';

describe('ListBranchesUseCase', () => {
  let branches: jest.Mocked<Pick<BranchRepository, 'listByGym'>>;
  let permissions: jest.Mocked<Pick<GymPermissionService, 'requirePermission'>>;
  let useCase: ListBranchesUseCase;

  beforeEach(() => {
    branches = { listByGym: jest.fn() };
    permissions = { requirePermission: jest.fn().mockResolvedValue(undefined) };
    useCase = new ListBranchesUseCase(
      branches as unknown as BranchRepository,
      permissions as unknown as GymPermissionService,
    );
  });

  it('lists the branches of the gym', async () => {
    branches.listByGym.mockResolvedValue([
      Object.assign(new Branch(), { id: 'b1', gymId: 'gym-1', name: 'Downtown', active: true }),
      Object.assign(new Branch(), { id: 'b2', gymId: 'gym-1', name: 'Uptown', active: false }),
    ]);

    const views = await useCase.execute('admin', 'gym-1');

    expect(views).toHaveLength(2);
    expect(views.map((v) => v.name)).toEqual(['Downtown', 'Uptown']);
  });
});
