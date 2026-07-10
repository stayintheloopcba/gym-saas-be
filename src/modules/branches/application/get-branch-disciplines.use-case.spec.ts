import { Discipline } from '../../disciplines/domain/discipline.entity';
import { DisciplineRepository } from '../../disciplines/domain/discipline.repository';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { BranchDiscipline } from '../domain/branch-discipline.entity';
import { BranchDisciplineRepository } from '../domain/branch-discipline.repository';
import { Branch } from '../domain/branch.entity';
import { BranchNotFoundError } from '../domain/branch.errors';
import { BranchRepository } from '../domain/branch.repository';
import { GetBranchDisciplinesUseCase } from './get-branch-disciplines.use-case';

describe('GetBranchDisciplinesUseCase', () => {
  let branches: jest.Mocked<Pick<BranchRepository, 'findById'>>;
  let branchDisciplines: jest.Mocked<Pick<BranchDisciplineRepository, 'listByBranch'>>;
  let disciplines: jest.Mocked<Pick<DisciplineRepository, 'findById'>>;
  let permissions: jest.Mocked<Pick<GymPermissionService, 'requirePermission'>>;
  let useCase: GetBranchDisciplinesUseCase;

  beforeEach(() => {
    branches = { findById: jest.fn() };
    branchDisciplines = { listByBranch: jest.fn() };
    disciplines = { findById: jest.fn() };
    permissions = { requirePermission: jest.fn().mockResolvedValue(undefined) };
    useCase = new GetBranchDisciplinesUseCase(
      branches as unknown as BranchRepository,
      branchDisciplines as unknown as BranchDisciplineRepository,
      disciplines as unknown as DisciplineRepository,
      permissions as unknown as GymPermissionService,
    );
  });

  it('returns only the active offered disciplines', async () => {
    branches.findById.mockResolvedValue(Object.assign(new Branch(), { id: 'branch-1' }));
    branchDisciplines.listByBranch.mockResolvedValue([
      Object.assign(new BranchDiscipline(), { disciplineId: 'd1', active: true }),
      Object.assign(new BranchDiscipline(), { disciplineId: 'd2', active: false }),
    ]);
    disciplines.findById.mockResolvedValue(
      Object.assign(new Discipline(), { id: 'd1', code: 'CROSSFIT', name: 'Crossfit', active: true }),
    );

    const views = await useCase.execute('admin', 'gym-1', 'branch-1');

    expect(views).toHaveLength(1);
    expect(views[0].code).toBe('CROSSFIT');
  });

  it('throws BranchNotFoundError when the branch does not exist', async () => {
    branches.findById.mockResolvedValue(null);

    await expect(useCase.execute('admin', 'gym-1', 'missing')).rejects.toBeInstanceOf(BranchNotFoundError);
  });
});
