import { Inject, Injectable } from '@nestjs/common';
import { Periodicity } from '../../../common/enums/periodicity.enum';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { PlanNotFoundError } from '../domain/plan.errors';
import { PLAN_BRANCH_REPOSITORY } from '../domain/plan-branch.repository';
import type { PlanBranchRepository } from '../domain/plan-branch.repository';
import { PLAN_DISCIPLINE_REPOSITORY } from '../domain/plan-discipline.repository';
import type { PlanDisciplineRepository } from '../domain/plan-discipline.repository';
import { PLAN_REPOSITORY } from '../domain/plan.repository';
import type { PlanRepository } from '../domain/plan.repository';
import { PlanView, toPlanView } from '../interfaces/plan.view';
import { ValidatePlanScope } from './validate-plan-scope';

export interface UpdatePlanCommand {
  callerUserId: string;
  gymId: string;
  planId: string;
  name?: string;
  price?: number;
  currency?: string;
  periodicity?: Periodicity;
  visitsPerMonth?: number;
  timeWindow?: Record<string, unknown>;
  active?: boolean;
  branchIds?: string[];
  disciplineIds?: string[];
}

@Injectable()
export class UpdatePlanUseCase {
  constructor(
    @Inject(PLAN_REPOSITORY) private readonly plans: PlanRepository,
    @Inject(PLAN_BRANCH_REPOSITORY) private readonly planBranches: PlanBranchRepository,
    @Inject(PLAN_DISCIPLINE_REPOSITORY) private readonly planDisciplines: PlanDisciplineRepository,
    private readonly validateScope: ValidatePlanScope,
    private readonly permissions: GymPermissionService,
  ) {}

  async execute(command: UpdatePlanCommand): Promise<PlanView> {
    await this.permissions.requirePermission(command.callerUserId, command.gymId, PERMISSIONS.PLANS_MANAGE);

    const plan = await this.plans.findById(command.gymId, command.planId);
    if (!plan) {
      throw new PlanNotFoundError(command.planId);
    }

    if (command.name !== undefined) plan.name = command.name;
    if (command.price !== undefined) plan.price = command.price;
    if (command.currency !== undefined) plan.currency = command.currency;
    if (command.periodicity !== undefined) plan.periodicity = command.periodicity;
    if (command.visitsPerMonth !== undefined) plan.visitsPerMonth = command.visitsPerMonth;
    if (command.timeWindow !== undefined) plan.timeWindow = command.timeWindow;
    if (command.active !== undefined) plan.active = command.active;

    const [currentBranches, currentDisciplines] = await Promise.all([
      this.planBranches.listByPlan(plan.id),
      this.planDisciplines.listByPlan(plan.id),
    ]);
    const effectiveBranchIds = command.branchIds ?? currentBranches.map((b) => b.branchId);
    const effectiveDisciplineIds = command.disciplineIds ?? currentDisciplines.map((d) => d.disciplineId);

    if (command.branchIds !== undefined || command.disciplineIds !== undefined) {
      await this.validateScope.execute(command.gymId, effectiveBranchIds, effectiveDisciplineIds);
      await this.planBranches.replaceSet(command.gymId, plan.id, effectiveBranchIds);
      await this.planDisciplines.replaceSet(command.gymId, plan.id, effectiveDisciplineIds);
    }

    const saved = await this.plans.save(plan);
    return toPlanView(saved, effectiveBranchIds, effectiveDisciplineIds);
  }
}
