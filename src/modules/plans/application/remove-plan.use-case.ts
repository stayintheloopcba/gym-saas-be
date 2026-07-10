import { Inject, Injectable } from '@nestjs/common';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { PlanNotFoundError } from '../domain/plan.errors';
import { PLAN_REPOSITORY } from '../domain/plan.repository';
import type { PlanRepository } from '../domain/plan.repository';

@Injectable()
export class RemovePlanUseCase {
  constructor(
    @Inject(PLAN_REPOSITORY) private readonly plans: PlanRepository,
    private readonly permissions: GymPermissionService,
  ) {}

  async execute(callerUserId: string, gymId: string, planId: string): Promise<void> {
    await this.permissions.requirePermission(callerUserId, gymId, PERMISSIONS.PLANS_MANAGE);

    const plan = await this.plans.findById(gymId, planId);
    if (!plan) {
      throw new PlanNotFoundError(planId);
    }

    await this.plans.softDelete(plan.id);
  }
}
