import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { Branch } from '../domain/branch.entity';
import { BranchNotFoundError } from '../domain/branch.errors';
import { BranchRepository } from '../domain/branch.repository';
import { GetBranchUseCase } from './get-branch.use-case';

describe('GetBranchUseCase', () => {
  let branches: jest.Mocked<Pick<BranchRepository, 'findById'>>;
  let permissions: jest.Mocked<Pick<GymPermissionService, 'requirePermission'>>;
  let useCase: GetBranchUseCase;

  beforeEach(() => {
    branches = { findById: jest.fn() };
    permissions = { requirePermission: jest.fn().mockResolvedValue(undefined) };
    useCase = new GetBranchUseCase(
      branches as unknown as BranchRepository,
      permissions as unknown as GymPermissionService,
    );
  });

  it('returns the branch view', async () => {
    branches.findById.mockResolvedValue(
      Object.assign(new Branch(), { id: 'branch-1', gymId: 'gym-1', name: 'Downtown', active: true }),
    );

    const view = await useCase.execute('admin', 'gym-1', 'branch-1');

    expect(view.name).toBe('Downtown');
  });

  it('throws BranchNotFoundError when missing', async () => {
    branches.findById.mockResolvedValue(null);

    await expect(useCase.execute('admin', 'gym-1', 'missing')).rejects.toBeInstanceOf(BranchNotFoundError);
  });
});
