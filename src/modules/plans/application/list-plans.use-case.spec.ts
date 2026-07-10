import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { Plan } from '../domain/plan.entity';
import { PlanBranchRepository } from '../domain/plan-branch.repository';
import { PlanDisciplineRepository } from '../domain/plan-discipline.repository';
import { PlanRepository } from '../domain/plan.repository';
import { ListPlansUseCase } from './list-plans.use-case';

describe('ListPlansUseCase', () => {
  let plans: jest.Mocked<Pick<PlanRepository, 'listByGym'>>;
  let planBranches: jest.Mocked<Pick<PlanBranchRepository, 'listByPlan'>>;
  let planDisciplines: jest.Mocked<Pick<PlanDisciplineRepository, 'listByPlan'>>;
  let permissions: jest.Mocked<Pick<GymPermissionService, 'requirePermission'>>;
  let useCase: ListPlansUseCase;

  beforeEach(() => {
    plans = {
      listByGym: jest.fn().mockResolvedValue([Object.assign(new Plan(), { id: 'p1', gymId: 'gym-1', name: 'A' })]),
    };
    planBranches = { listByPlan: jest.fn().mockResolvedValue([]) };
    planDisciplines = { listByPlan: jest.fn().mockResolvedValue([]) };
    permissions = { requirePermission: jest.fn().mockResolvedValue(undefined) };
    useCase = new ListPlansUseCase(
      plans as unknown as PlanRepository,
      planBranches as unknown as PlanBranchRepository,
      planDisciplines as unknown as PlanDisciplineRepository,
      permissions as unknown as GymPermissionService,
    );
  });

  it('lists the plans of the gym', async () => {
    const views = await useCase.execute('admin', 'gym-1');

    expect(views).toHaveLength(1);
    expect(views[0].name).toBe('A');
  });
});
