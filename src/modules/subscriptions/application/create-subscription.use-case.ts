import { Inject, Injectable } from '@nestjs/common';
import { RenewalMode } from '../../../common/enums/renewal-mode.enum';
import { SubscriptionStatus } from '../../../common/enums/subscription-status.enum';
import { MemberNotFoundError } from '../../members/domain/member.errors';
import { MEMBER_REPOSITORY } from '../../members/domain/member.repository';
import type { MemberRepository } from '../../members/domain/member.repository';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { PlanNotFoundError } from '../../plans/domain/plan.errors';
import { PLAN_BRANCH_REPOSITORY } from '../../plans/domain/plan-branch.repository';
import type { PlanBranchRepository } from '../../plans/domain/plan-branch.repository';
import { PLAN_REPOSITORY } from '../../plans/domain/plan.repository';
import type { PlanRepository } from '../../plans/domain/plan.repository';
import { MemberNotAllowedForPlanError, PlanNotActiveError } from '../domain/subscription.errors';
import { Subscription } from '../domain/subscription.entity';
import { SUBSCRIPTION_REPOSITORY } from '../domain/subscription.repository';
import type { SubscriptionRepository } from '../domain/subscription.repository';
import { SubscriptionView, toSubscriptionView } from '../interfaces/subscription.view';

export interface CreateSubscriptionCommand {
  callerUserId: string;
  gymId: string;
  memberId: string;
  planId: string;
  startDate?: string;
  endDate?: string;
  renewalMode?: RenewalMode;
}

const today = (): string => new Date().toISOString().slice(0, 10);

/**
 * Suscribe un member a un plan. Valida que el plan esté activo y que, si el
 * member tiene una sede base fija, el plan esté habilitado ahí (UC-4).
 */
@Injectable()
export class CreateSubscriptionUseCase {
  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY) private readonly subscriptions: SubscriptionRepository,
    @Inject(MEMBER_REPOSITORY) private readonly members: MemberRepository,
    @Inject(PLAN_REPOSITORY) private readonly plans: PlanRepository,
    @Inject(PLAN_BRANCH_REPOSITORY) private readonly planBranches: PlanBranchRepository,
    private readonly permissions: GymPermissionService,
  ) {}

  async execute(command: CreateSubscriptionCommand): Promise<SubscriptionView> {
    await this.permissions.requirePermission(command.callerUserId, command.gymId, PERMISSIONS.SUBSCRIPTIONS_MANAGE);

    const member = await this.members.findById(command.gymId, command.memberId);
    if (!member) {
      throw new MemberNotFoundError(command.memberId);
    }

    const plan = await this.plans.findById(command.gymId, command.planId);
    if (!plan) {
      throw new PlanNotFoundError(command.planId);
    }
    if (!plan.active) {
      throw new PlanNotActiveError();
    }

    if (member.branchId) {
      const planBranchIds = (await this.planBranches.listByPlan(plan.id)).map((pb) => pb.branchId);
      if (!planBranchIds.includes(member.branchId)) {
        throw new MemberNotAllowedForPlanError();
      }
    }

    const subscription = new Subscription();
    subscription.gymId = command.gymId;
    subscription.memberId = command.memberId;
    subscription.planId = command.planId;
    subscription.startDate = command.startDate ?? today();
    subscription.endDate = command.endDate ?? null;
    subscription.paidUntil = null;
    subscription.status = SubscriptionStatus.ACTIVE;
    subscription.renewalMode = command.renewalMode ?? RenewalMode.MANUAL;

    const saved = await this.subscriptions.save(subscription);
    return toSubscriptionView(saved);
  }
}
