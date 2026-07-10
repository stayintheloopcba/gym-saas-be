import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { Branch } from '../domain/branch.entity';
import { BranchNotFoundError } from '../domain/branch.errors';
import { BranchRepository } from '../domain/branch.repository';
import { UpdateBranchUseCase } from './update-branch.use-case';

describe('UpdateBranchUseCase', () => {
  let branches: jest.Mocked<Pick<BranchRepository, 'findById' | 'save'>>;
  let permissions: jest.Mocked<Pick<GymPermissionService, 'requirePermission'>>;
  let useCase: UpdateBranchUseCase;

  beforeEach(() => {
    branches = {
      findById: jest.fn(),
      save: jest.fn((branch: Branch) => Promise.resolve(branch)),
    };
    permissions = { requirePermission: jest.fn().mockResolvedValue(undefined) };
    useCase = new UpdateBranchUseCase(
      branches as unknown as BranchRepository,
      permissions as unknown as GymPermissionService,
    );
  });

  it('applies only the provided fields', async () => {
    branches.findById.mockResolvedValue(
      Object.assign(new Branch(), { id: 'branch-1', gymId: 'gym-1', name: 'Downtown', active: true }),
    );

    const view = await useCase.execute({ callerUserId: 'admin', gymId: 'gym-1', branchId: 'branch-1', active: false });

    expect(view.active).toBe(false);
    expect(view.name).toBe('Downtown');
  });

  it('throws BranchNotFoundError when missing', async () => {
    branches.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ callerUserId: 'admin', gymId: 'gym-1', branchId: 'missing', name: 'X' }),
    ).rejects.toBeInstanceOf(BranchNotFoundError);
  });
});
