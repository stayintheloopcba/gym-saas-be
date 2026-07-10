import { Member } from '../../members/domain/member.entity';
import { MemberNotFoundError } from '../../members/domain/member.errors';
import { MemberRepository } from '../../members/domain/member.repository';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { Plan } from '../../plans/domain/plan.entity';
import { PlanNotFoundError } from '../../plans/domain/plan.errors';
import { PlanBranch } from '../../plans/domain/plan-branch.entity';
import { PlanBranchRepository } from '../../plans/domain/plan-branch.repository';
import { PlanRepository } from '../../plans/domain/plan.repository';
import { Subscription } from '../domain/subscription.entity';
import { MemberNotAllowedForPlanError, PlanNotActiveError } from '../domain/subscription.errors';
import { SubscriptionRepository } from '../domain/subscription.repository';
import { CreateSubscriptionUseCase } from './create-subscription.use-case';

describe('CreateSubscriptionUseCase', () => {
  let subscriptions: jest.Mocked<Pick<SubscriptionRepository, 'save'>>;
  let members: jest.Mocked<Pick<MemberRepository, 'findById'>>;
  let plans: jest.Mocked<Pick<PlanRepository, 'findById'>>;
  let planBranches: jest.Mocked<Pick<PlanBranchRepository, 'listByPlan'>>;
  let permissions: jest.Mocked<Pick<GymPermissionService, 'requirePermission'>>;
  let useCase: CreateSubscriptionUseCase;

  beforeEach(() => {
    subscriptions = { save: jest.fn((s: Subscription) => Promise.resolve(s)) };
    members = {
      findById: jest.fn().mockResolvedValue(Object.assign(new Member(), { id: 'member-1', branchId: null })),
    };
    plans = { findById: jest.fn().mockResolvedValue(Object.assign(new Plan(), { id: 'plan-1', active: true })) };
    planBranches = { listByPlan: jest.fn().mockResolvedValue([Object.assign(new PlanBranch(), { branchId: 'b1' })]) };
    permissions = { requirePermission: jest.fn().mockResolvedValue(undefined) };
    useCase = new CreateSubscriptionUseCase(
      subscriptions as unknown as SubscriptionRepository,
      members as unknown as MemberRepository,
      plans as unknown as PlanRepository,
      planBranches as unknown as PlanBranchRepository,
      permissions as unknown as GymPermissionService,
    );
  });

  it('creates a subscription for a member with no home branch restriction', async () => {
    const view = await useCase.execute({
      callerUserId: 'admin',
      gymId: 'gym-1',
      memberId: 'member-1',
      planId: 'plan-1',
    });

    expect(view.status).toBe('ACTIVE');
    expect(view.paidUntil).toBeNull();
  });

  it('throws MemberNotFoundError when the member does not exist', async () => {
    members.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ callerUserId: 'admin', gymId: 'gym-1', memberId: 'missing', planId: 'plan-1' }),
    ).rejects.toBeInstanceOf(MemberNotFoundError);
  });

  it('throws PlanNotFoundError when the plan does not exist', async () => {
    plans.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ callerUserId: 'admin', gymId: 'gym-1', memberId: 'member-1', planId: 'missing' }),
    ).rejects.toBeInstanceOf(PlanNotFoundError);
  });

  it('rejects an inactive plan', async () => {
    plans.findById.mockResolvedValue(Object.assign(new Plan(), { id: 'plan-1', active: false }));

    await expect(
      useCase.execute({ callerUserId: 'admin', gymId: 'gym-1', memberId: 'member-1', planId: 'plan-1' }),
    ).rejects.toBeInstanceOf(PlanNotActiveError);
  });

  it('rejects when the plan is not available at the member home branch', async () => {
    members.findById.mockResolvedValue(Object.assign(new Member(), { id: 'member-1', branchId: 'other-branch' }));

    await expect(
      useCase.execute({ callerUserId: 'admin', gymId: 'gym-1', memberId: 'member-1', planId: 'plan-1' }),
    ).rejects.toBeInstanceOf(MemberNotAllowedForPlanError);
  });

  it('allows a member whose home branch is included in the plan', async () => {
    members.findById.mockResolvedValue(Object.assign(new Member(), { id: 'member-1', branchId: 'b1' }));

    await expect(
      useCase.execute({ callerUserId: 'admin', gymId: 'gym-1', memberId: 'member-1', planId: 'plan-1' }),
    ).resolves.toBeDefined();
  });
});
