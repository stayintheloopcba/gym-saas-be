import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { Plan } from '../domain/plan.entity';
import { PlanNotFoundError } from '../domain/plan.errors';
import { PlanBranch } from '../domain/plan-branch.entity';
import { PlanBranchRepository } from '../domain/plan-branch.repository';
import { PlanDiscipline } from '../domain/plan-discipline.entity';
import { PlanDisciplineRepository } from '../domain/plan-discipline.repository';
import { PlanRepository } from '../domain/plan.repository';
import { UpdatePlanUseCase } from './update-plan.use-case';
import { ValidatePlanScope } from './validate-plan-scope';

describe('UpdatePlanUseCase', () => {
  let plans: jest.Mocked<Pick<PlanRepository, 'findById' | 'save'>>;
  let planBranches: jest.Mocked<Pick<PlanBranchRepository, 'listByPlan' | 'replaceSet'>>;
  let planDisciplines: jest.Mocked<Pick<PlanDisciplineRepository, 'listByPlan' | 'replaceSet'>>;
  let validateScope: jest.Mocked<Pick<ValidatePlanScope, 'execute'>>;
  let permissions: jest.Mocked<Pick<GymPermissionService, 'requirePermission'>>;
  let useCase: UpdatePlanUseCase;

  beforeEach(() => {
    plans = {
      findById: jest.fn().mockResolvedValue(Object.assign(new Plan(), { id: 'plan-1', gymId: 'gym-1', name: 'Old' })),
      save: jest.fn((plan: Plan) => Promise.resolve(plan)),
    };
    planBranches = {
      listByPlan: jest.fn().mockResolvedValue([Object.assign(new PlanBranch(), { branchId: 'b1' })]),
      replaceSet: jest.fn().mockResolvedValue([]),
    };
    planDisciplines = {
      listByPlan: jest.fn().mockResolvedValue([Object.assign(new PlanDiscipline(), { disciplineId: 'd1' })]),
      replaceSet: jest.fn().mockResolvedValue([]),
    };
    validateScope = { execute: jest.fn().mockResolvedValue(undefined) };
    permissions = { requirePermission: jest.fn().mockResolvedValue(undefined) };
    useCase = new UpdatePlanUseCase(
      plans as unknown as PlanRepository,
      planBranches as unknown as PlanBranchRepository,
      planDisciplines as unknown as PlanDisciplineRepository,
      validateScope as unknown as ValidatePlanScope,
      permissions as unknown as GymPermissionService,
    );
  });

  it('applies only the provided fields without touching joins when neither list is provided', async () => {
    const view = await useCase.execute({ callerUserId: 'admin', gymId: 'gym-1', planId: 'plan-1', name: 'New' });

    expect(view.name).toBe('New');
    expect(view.branchIds).toEqual(['b1']);
    expect(validateScope.execute).not.toHaveBeenCalled();
    expect(planBranches.replaceSet).not.toHaveBeenCalled();
  });

  it('re-validates and replaces both joins when branchIds changes', async () => {
    const view = await useCase.execute({
      callerUserId: 'admin',
      gymId: 'gym-1',
      planId: 'plan-1',
      branchIds: ['b2'],
    });

    expect(validateScope.execute).toHaveBeenCalledWith('gym-1', ['b2'], ['d1']);
    expect(planBranches.replaceSet).toHaveBeenCalledWith('gym-1', 'plan-1', ['b2']);
    expect(view.branchIds).toEqual(['b2']);
  });

  it('throws PlanNotFoundError when missing', async () => {
    plans.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ callerUserId: 'admin', gymId: 'gym-1', planId: 'missing', name: 'X' }),
    ).rejects.toBeInstanceOf(PlanNotFoundError);
  });
});
