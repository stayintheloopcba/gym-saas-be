import { Inject, Injectable } from '@nestjs/common';
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

@Injectable()
export class GetPlanUseCase {
  constructor(
    @Inject(PLAN_REPOSITORY) private readonly plans: PlanRepository,
    @Inject(PLAN_BRANCH_REPOSITORY) private readonly planBranches: PlanBranchRepository,
    @Inject(PLAN_DISCIPLINE_REPOSITORY) private readonly planDisciplines: PlanDisciplineRepository,
    private readonly permissions: GymPermissionService,
  ) {}

  async execute(callerUserId: string, gymId: string, planId: string): Promise<PlanView> {
    await this.permissions.requirePermission(callerUserId, gymId, PERMISSIONS.PLANS_READ);

    const plan = await this.plans.findById(gymId, planId);
    if (!plan) {
      throw new PlanNotFoundError(planId);
    }

    const [branches, disciplines] = await Promise.all([
      this.planBranches.listByPlan(planId),
      this.planDisciplines.listByPlan(planId),
    ]);

    return toPlanView(
      plan,
      branches.map((b) => b.branchId),
      disciplines.map((d) => d.disciplineId),
    );
  }
}
