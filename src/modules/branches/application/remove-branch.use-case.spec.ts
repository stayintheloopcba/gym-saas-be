import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { Branch } from '../domain/branch.entity';
import { BranchNotFoundError } from '../domain/branch.errors';
import { BranchRepository } from '../domain/branch.repository';
import { RemoveBranchUseCase } from './remove-branch.use-case';

describe('RemoveBranchUseCase', () => {
  let branches: jest.Mocked<Pick<BranchRepository, 'findById' | 'softDelete'>>;
  let permissions: jest.Mocked<Pick<GymPermissionService, 'requirePermission'>>;
  let useCase: RemoveBranchUseCase;

  beforeEach(() => {
    branches = { findById: jest.fn(), softDelete: jest.fn() };
    permissions = { requirePermission: jest.fn().mockResolvedValue(undefined) };
    useCase = new RemoveBranchUseCase(
      branches as unknown as BranchRepository,
      permissions as unknown as GymPermissionService,
    );
  });

  it('soft-deletes an existing branch', async () => {
    branches.findById.mockResolvedValue(Object.assign(new Branch(), { id: 'branch-1' }));

    await useCase.execute('admin', 'gym-1', 'branch-1');

    expect(branches.softDelete).toHaveBeenCalledWith('branch-1');
  });

  it('throws BranchNotFoundError when missing', async () => {
    branches.findById.mockResolvedValue(null);

    await expect(useCase.execute('admin', 'gym-1', 'missing')).rejects.toBeInstanceOf(BranchNotFoundError);
    expect(branches.softDelete).not.toHaveBeenCalled();
  });
});
