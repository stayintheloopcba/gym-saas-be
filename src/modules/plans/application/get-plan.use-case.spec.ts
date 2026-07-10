import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { Plan } from '../domain/plan.entity';
import { PlanNotFoundError } from '../domain/plan.errors';
import { PlanBranch } from '../domain/plan-branch.entity';
import { PlanBranchRepository } from '../domain/plan-branch.repository';
import { PlanDiscipline } from '../domain/plan-discipline.entity';
import { PlanDisciplineRepository } from '../domain/plan-discipline.repository';
import { PlanRepository } from '../domain/plan.repository';
import { GetPlanUseCase } from './get-plan.use-case';

describe('GetPlanUseCase', () => {
  let plans: jest.Mocked<Pick<PlanRepository, 'findById'>>;
  let planBranches: jest.Mocked<Pick<PlanBranchRepository, 'listByPlan'>>;
  let planDisciplines: jest.Mocked<Pick<PlanDisciplineRepository, 'listByPlan'>>;
  let permissions: jest.Mocked<Pick<GymPermissionService, 'requirePermission'>>;
  let useCase: GetPlanUseCase;

  beforeEach(() => {
    plans = { findById: jest.fn() };
    planBranches = { listByPlan: jest.fn().mockResolvedValue([Object.assign(new PlanBranch(), { branchId: 'b1' })]) };
    planDisciplines = {
      listByPlan: jest.fn().mockResolvedValue([Object.assign(new PlanDiscipline(), { disciplineId: 'd1' })]),
    };
    permissions = { requirePermission: jest.fn().mockResolvedValue(undefined) };
    useCase = new GetPlanUseCase(
      plans as unknown as PlanRepository,
      planBranches as unknown as PlanBranchRepository,
      planDisciplines as unknown as PlanDisciplineRepository,
      permissions as unknown as GymPermissionService,
    );
  });

  it('returns the plan view with its branch/discipline ids', async () => {
    plans.findById.mockResolvedValue(Object.assign(new Plan(), { id: 'plan-1', gymId: 'gym-1' }));

    const view = await useCase.execute('admin', 'gym-1', 'plan-1');

    expect(view.branchIds).toEqual(['b1']);
    expect(view.disciplineIds).toEqual(['d1']);
  });

  it('throws PlanNotFoundError when missing', async () => {
    plans.findById.mockResolvedValue(null);

    await expect(useCase.execute('admin', 'gym-1', 'missing')).rejects.toBeInstanceOf(PlanNotFoundError);
  });
});
