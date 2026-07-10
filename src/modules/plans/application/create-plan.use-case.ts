import { Inject, Injectable } from '@nestjs/common';
import { Periodicity } from '../../../common/enums/periodicity.enum';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { Plan } from '../domain/plan.entity';
import { PLAN_BRANCH_REPOSITORY } from '../domain/plan-branch.repository';
import type { PlanBranchRepository } from '../domain/plan-branch.repository';
import { PLAN_DISCIPLINE_REPOSITORY } from '../domain/plan-discipline.repository';
import type { PlanDisciplineRepository } from '../domain/plan-discipline.repository';
import { PLAN_REPOSITORY } from '../domain/plan.repository';
import type { PlanRepository } from '../domain/plan.repository';
import { PlanView, toPlanView } from '../interfaces/plan.view';
import { ValidatePlanScope } from './validate-plan-scope';

export interface CreatePlanCommand {
  callerUserId: string;
  gymId: string;
  name: string;
  price: number;
  currency: string;
  periodicity: Periodicity;
  visitsPerMonth?: number;
  timeWindow?: Record<string, unknown>;
  active?: boolean;
  branchIds: string[];
  disciplineIds: string[];
}

@Injectable()
export class CreatePlanUseCase {
  constructor(
    @Inject(PLAN_REPOSITORY) private readonly plans: PlanRepository,
    @Inject(PLAN_BRANCH_REPOSITORY) private readonly planBranches: PlanBranchRepository,
    @Inject(PLAN_DISCIPLINE_REPOSITORY) private readonly planDisciplines: PlanDisciplineRepository,
    private readonly validateScope: ValidatePlanScope,
    private readonly permissions: GymPermissionService,
  ) {}

  async execute(command: CreatePlanCommand): Promise<PlanView> {
    await this.permissions.requirePermission(command.callerUserId, command.gymId, PERMISSIONS.PLANS_MANAGE);
    await this.validateScope.execute(command.gymId, command.branchIds, command.disciplineIds);

    const plan = new Plan();
    plan.gymId = command.gymId;
    plan.name = command.name;
    plan.price = command.price;
    plan.currency = command.currency;
    plan.periodicity = command.periodicity;
    plan.visitsPerMonth = command.visitsPerMonth ?? null;
    plan.timeWindow = command.timeWindow ?? null;
    plan.active = command.active ?? true;

    const saved = await this.plans.save(plan);
    await this.planBranches.replaceSet(command.gymId, saved.id, command.branchIds);
    await this.planDisciplines.replaceSet(command.gymId, saved.id, command.disciplineIds);

    return toPlanView(saved, command.branchIds, command.disciplineIds);
  }
}
