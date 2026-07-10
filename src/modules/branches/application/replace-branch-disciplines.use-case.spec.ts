import { Discipline } from '../../disciplines/domain/discipline.entity';
import { DisciplineNotFoundError } from '../../disciplines/domain/discipline.errors';
import { DisciplineRepository } from '../../disciplines/domain/discipline.repository';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { BranchDisciplineRepository } from '../domain/branch-discipline.repository';
import { Branch } from '../domain/branch.entity';
import { BranchNotFoundError } from '../domain/branch.errors';
import { BranchRepository } from '../domain/branch.repository';
import { ReplaceBranchDisciplinesUseCase } from './replace-branch-disciplines.use-case';

describe('ReplaceBranchDisciplinesUseCase', () => {
  let branches: jest.Mocked<Pick<BranchRepository, 'findById'>>;
  let branchDisciplines: jest.Mocked<Pick<BranchDisciplineRepository, 'replaceSet'>>;
  let disciplines: jest.Mocked<Pick<DisciplineRepository, 'findById'>>;
  let permissions: jest.Mocked<Pick<GymPermissionService, 'requirePermission'>>;
  let useCase: ReplaceBranchDisciplinesUseCase;

  beforeEach(() => {
    branches = { findById: jest.fn().mockResolvedValue(Object.assign(new Branch(), { id: 'branch-1' })) };
    branchDisciplines = { replaceSet: jest.fn().mockResolvedValue([]) };
    disciplines = {
      findById: jest
        .fn()
        .mockResolvedValue(Object.assign(new Discipline(), { id: 'd1', code: 'CROSSFIT', name: 'Crossfit' })),
    };
    permissions = { requirePermission: jest.fn().mockResolvedValue(undefined) };
    useCase = new ReplaceBranchDisciplinesUseCase(
      branches as unknown as BranchRepository,
      branchDisciplines as unknown as BranchDisciplineRepository,
      disciplines as unknown as DisciplineRepository,
      permissions as unknown as GymPermissionService,
    );
  });

  it('replaces the set and returns the resolved discipline views', async () => {
    const views = await useCase.execute('admin', 'gym-1', 'branch-1', ['d1']);

    expect(views).toEqual([{ id: 'd1', code: 'CROSSFIT', name: 'Crossfit', active: undefined }]);
    expect(branchDisciplines.replaceSet).toHaveBeenCalledWith('gym-1', 'branch-1', ['d1']);
  });

  it('deduplicates repeated ids before persisting', async () => {
    await useCase.execute('admin', 'gym-1', 'branch-1', ['d1', 'd1']);

    expect(branchDisciplines.replaceSet).toHaveBeenCalledWith('gym-1', 'branch-1', ['d1']);
  });

  it('throws BranchNotFoundError when the branch does not exist', async () => {
    branches.findById.mockResolvedValue(null);

    await expect(useCase.execute('admin', 'gym-1', 'missing', ['d1'])).rejects.toBeInstanceOf(BranchNotFoundError);
    expect(branchDisciplines.replaceSet).not.toHaveBeenCalled();
  });

  it('throws DisciplineNotFoundError for an unknown discipline id', async () => {
    disciplines.findById.mockResolvedValue(null);

    await expect(useCase.execute('admin', 'gym-1', 'branch-1', ['ghost'])).rejects.toBeInstanceOf(
      DisciplineNotFoundError,
    );
    expect(branchDisciplines.replaceSet).not.toHaveBeenCalled();
  });
});
