import { BranchDisciplineRepository } from '../../branches/domain/branch-discipline.repository';
import { Branch } from '../../branches/domain/branch.entity';
import { BranchNotFoundError } from '../../branches/domain/branch.errors';
import { BranchRepository } from '../../branches/domain/branch.repository';
import { Discipline } from '../../disciplines/domain/discipline.entity';
import { DisciplineNotFoundError } from '../../disciplines/domain/discipline.errors';
import { DisciplineRepository } from '../../disciplines/domain/discipline.repository';
import { DisciplineNotOfferedError, PlanWithoutBranchesError } from '../domain/plan.errors';
import { ValidatePlanScope } from './validate-plan-scope';

describe('ValidatePlanScope', () => {
  let branches: jest.Mocked<Pick<BranchRepository, 'findById'>>;
  let disciplines: jest.Mocked<Pick<DisciplineRepository, 'findById'>>;
  let branchDisciplines: jest.Mocked<Pick<BranchDisciplineRepository, 'isOffered'>>;
  let validate: ValidatePlanScope;

  beforeEach(() => {
    branches = { findById: jest.fn().mockResolvedValue(Object.assign(new Branch(), { id: 'branch-1' })) };
    disciplines = {
      findById: jest.fn().mockResolvedValue(Object.assign(new Discipline(), { id: 'd1' })),
    };
    branchDisciplines = { isOffered: jest.fn().mockResolvedValue(true) };
    validate = new ValidatePlanScope(
      branches as unknown as BranchRepository,
      disciplines as unknown as DisciplineRepository,
      branchDisciplines as unknown as BranchDisciplineRepository,
    );
  });

  it('passes when there is at least one branch and disciplines are all offered', async () => {
    await expect(validate.execute('gym-1', ['branch-1'], ['d1'])).resolves.toBeUndefined();
  });

  it('rejects a plan without branches', async () => {
    await expect(validate.execute('gym-1', [], [])).rejects.toBeInstanceOf(PlanWithoutBranchesError);
  });

  it('rejects an unknown branch id', async () => {
    branches.findById.mockResolvedValue(null);

    await expect(validate.execute('gym-1', ['missing'], [])).rejects.toBeInstanceOf(BranchNotFoundError);
  });

  it('rejects an unknown discipline id', async () => {
    disciplines.findById.mockResolvedValue(null);

    await expect(validate.execute('gym-1', ['branch-1'], ['ghost'])).rejects.toBeInstanceOf(DisciplineNotFoundError);
  });

  it('rejects a discipline not offered at one of the branches', async () => {
    branchDisciplines.isOffered.mockResolvedValue(false);

    await expect(validate.execute('gym-1', ['branch-1'], ['d1'])).rejects.toBeInstanceOf(DisciplineNotOfferedError);
  });
});
