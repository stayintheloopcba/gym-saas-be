import { Periodicity } from '../../../common/enums/periodicity.enum';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { Plan } from '../domain/plan.entity';
import { PlanBranchRepository } from '../domain/plan-branch.repository';
import { PlanDisciplineRepository } from '../domain/plan-discipline.repository';
import { PlanRepository } from '../domain/plan.repository';
import { CreatePlanUseCase } from './create-plan.use-case';
import { ValidatePlanScope } from './validate-plan-scope';

describe('CreatePlanUseCase', () => {
  let plans: jest.Mocked<Pick<PlanRepository, 'save'>>;
  let planBranches: jest.Mocked<Pick<PlanBranchRepository, 'replaceSet'>>;
  let planDisciplines: jest.Mocked<Pick<PlanDisciplineRepository, 'replaceSet'>>;
  let validateScope: jest.Mocked<Pick<ValidatePlanScope, 'execute'>>;
  let permissions: jest.Mocked<Pick<GymPermissionService, 'requirePermission'>>;
  let useCase: CreatePlanUseCase;

  beforeEach(() => {
    plans = { save: jest.fn((plan: Plan) => Promise.resolve(Object.assign(plan, { id: 'plan-1' }))) };
    planBranches = { replaceSet: jest.fn().mockResolvedValue([]) };
    planDisciplines = { replaceSet: jest.fn().mockResolvedValue([]) };
    validateScope = { execute: jest.fn().mockResolvedValue(undefined) };
    permissions = { requirePermission: jest.fn().mockResolvedValue(undefined) };
    useCase = new CreatePlanUseCase(
      plans as unknown as PlanRepository,
      planBranches as unknown as PlanBranchRepository,
      planDisciplines as unknown as PlanDisciplineRepository,
      validateScope as unknown as ValidatePlanScope,
      permissions as unknown as GymPermissionService,
    );
  });

  it('creates a plan and writes through the branch/discipline joins', async () => {
    const view = await useCase.execute({
      callerUserId: 'admin',
      gymId: 'gym-1',
      name: 'Full access',
      price: 15000,
      currency: 'ARS',
      periodicity: Periodicity.MONTHLY,
      branchIds: ['branch-1'],
      disciplineIds: ['d1'],
    });

    expect(view.id).toBe('plan-1');
    expect(validateScope.execute).toHaveBeenCalledWith('gym-1', ['branch-1'], ['d1']);
    expect(planBranches.replaceSet).toHaveBeenCalledWith('gym-1', 'plan-1', ['branch-1']);
    expect(planDisciplines.replaceSet).toHaveBeenCalledWith('gym-1', 'plan-1', ['d1']);
  });

  it('propagates validation failures without persisting', async () => {
    validateScope.execute.mockRejectedValue(new Error('invalid scope'));

    await expect(
      useCase.execute({
        callerUserId: 'admin',
        gymId: 'gym-1',
        name: 'Full access',
        price: 15000,
        currency: 'ARS',
        periodicity: Periodicity.MONTHLY,
        branchIds: [],
        disciplineIds: [],
      }),
    ).rejects.toThrow('invalid scope');
    expect(plans.save).not.toHaveBeenCalled();
  });
});
