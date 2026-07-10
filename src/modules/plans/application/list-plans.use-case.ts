import { Inject, Injectable } from '@nestjs/common';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { PLAN_BRANCH_REPOSITORY } from '../domain/plan-branch.repository';
import type { PlanBranchRepository } from '../domain/plan-branch.repository';
import { PLAN_DISCIPLINE_REPOSITORY } from '../domain/plan-discipline.repository';
import type { PlanDisciplineRepository } from '../domain/plan-discipline.repository';
import { PLAN_REPOSITORY } from '../domain/plan.repository';
import type { PlanRepository } from '../domain/plan.repository';
import { PlanView, toPlanView } from '../interfaces/plan.view';

@Injectable()
export class ListPlansUseCase {
  constructor(
    @Inject(PLAN_REPOSITORY) private readonly plans: PlanRepository,
    @Inject(PLAN_BRANCH_REPOSITORY) private readonly planBranches: PlanBranchRepository,
    @Inject(PLAN_DISCIPLINE_REPOSITORY) private readonly planDisciplines: PlanDisciplineRepository,
    private readonly permissions: GymPermissionService,
  ) {}

  async execute(callerUserId: string, gymId: string): Promise<PlanView[]> {
    await this.permissions.requirePermission(callerUserId, gymId, PERMISSIONS.PLANS_READ);

    const plans = await this.plans.listByGym(gymId);

    const views: PlanView[] = [];
    for (const plan of plans) {
      const [branches, disciplines] = await Promise.all([
        this.planBranches.listByPlan(plan.id),
        this.planDisciplines.listByPlan(plan.id),
      ]);
      views.push(
        toPlanView(
          plan,
          branches.map((b) => b.branchId),
          disciplines.map((d) => d.disciplineId),
        ),
      );
    }
    return views;
  }
}
