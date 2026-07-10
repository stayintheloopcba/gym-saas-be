import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { Branch } from '../domain/branch.entity';
import { BranchRepository } from '../domain/branch.repository';
import { CreateBranchUseCase } from './create-branch.use-case';

describe('CreateBranchUseCase', () => {
  let branches: jest.Mocked<Pick<BranchRepository, 'save'>>;
  let permissions: jest.Mocked<Pick<GymPermissionService, 'requirePermission'>>;
  let useCase: CreateBranchUseCase;

  beforeEach(() => {
    branches = { save: jest.fn((branch: Branch) => Promise.resolve(branch)) };
    permissions = { requirePermission: jest.fn().mockResolvedValue(undefined) };
    useCase = new CreateBranchUseCase(
      branches as unknown as BranchRepository,
      permissions as unknown as GymPermissionService,
    );
  });

  it('creates a branch defaulting active to true', async () => {
    const branch = await useCase.execute({ callerUserId: 'admin', gymId: 'gym-1', name: 'Downtown' });

    expect(branch.gymId).toBe('gym-1');
    expect(branch.active).toBe(true);
  });

  it('respects an explicit active: false', async () => {
    const branch = await useCase.execute({
      callerUserId: 'admin',
      gymId: 'gym-1',
      name: 'Downtown',
      active: false,
    });

    expect(branch.active).toBe(false);
  });

  it('requires BRANCHES_MANAGE', async () => {
    permissions.requirePermission.mockRejectedValue(new Error('forbidden'));

    await expect(useCase.execute({ callerUserId: 'admin', gymId: 'gym-1', name: 'Downtown' })).rejects.toThrow(
      'forbidden',
    );
    expect(branches.save).not.toHaveBeenCalled();
  });
});
