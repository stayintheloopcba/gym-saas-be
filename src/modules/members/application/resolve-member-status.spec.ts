import { SubscriptionStatus } from '../../../common/enums/subscription-status.enum';
import { GymSettings } from '../../gym-settings/domain/gym-settings.entity';
import { GymSettingsRepository } from '../../gym-settings/domain/gym-settings.repository';
import { Subscription } from '../../subscriptions/domain/subscription.entity';
import { SubscriptionRepository } from '../../subscriptions/domain/subscription.repository';
import { MemberStatus } from '../domain/member-status.enum';
import { Member } from '../domain/member.entity';
import { ResolveMemberStatus } from './resolve-member-status';

const buildMember = (overrides: Partial<Member> = {}): Member =>
  Object.assign(new Member(), { id: 'member-1', status: MemberStatus.ACTIVE, ...overrides });

const buildSubscription = (paidUntil: string | null): Subscription =>
  Object.assign(new Subscription(), {
    id: 'sub-1',
    memberId: 'member-1',
    paidUntil,
    status: SubscriptionStatus.ACTIVE,
  });

describe('ResolveMemberStatus', () => {
  let subscriptions: jest.Mocked<Pick<SubscriptionRepository, 'list'>>;
  let gymSettings: jest.Mocked<Pick<GymSettingsRepository, 'findByGymId'>>;
  let resolve: ResolveMemberStatus;

  const daysAgo = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().slice(0, 10);
  };
  const daysFromNow = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  };

  beforeEach(() => {
    subscriptions = { list: jest.fn().mockResolvedValue([]) };
    gymSettings = {
      findByGymId: jest.fn().mockResolvedValue(Object.assign(new GymSettings(), { moraGraceDays: 5 })),
    };
    resolve = new ResolveMemberStatus(
      subscriptions as unknown as SubscriptionRepository,
      gymSettings as unknown as GymSettingsRepository,
    );
  });

  it('never overrides a non-ACTIVE stored status', async () => {
    const suspended = buildMember({ status: MemberStatus.SUSPENDED });

    await expect(resolve.execute('gym-1', suspended)).resolves.toBe(MemberStatus.SUSPENDED);
    expect(subscriptions.list).not.toHaveBeenCalled();
  });

  it('stays ACTIVE when the member has no active subscriptions', async () => {
    await expect(resolve.execute('gym-1', buildMember())).resolves.toBe(MemberStatus.ACTIVE);
  });

  it('stays ACTIVE while paidUntil + graceDays has not passed yet', async () => {
    subscriptions.list.mockResolvedValue([buildSubscription(daysFromNow(2))]);

    await expect(resolve.execute('gym-1', buildMember())).resolves.toBe(MemberStatus.ACTIVE);
  });

  it('becomes OVERDUE once paidUntil + graceDays is in the past — a payment extends it back to ACTIVE', async () => {
    // paidUntil was 10 days ago, grace is 5 days -> well past due.
    subscriptions.list.mockResolvedValue([buildSubscription(daysAgo(10))]);
    await expect(resolve.execute('gym-1', buildMember())).resolves.toBe(MemberStatus.OVERDUE);

    // Recording a payment recomputes paidUntil into the future (simulated here directly).
    subscriptions.list.mockResolvedValue([buildSubscription(daysFromNow(20))]);
    await expect(resolve.execute('gym-1', buildMember())).resolves.toBe(MemberStatus.ACTIVE);
  });

  it('becomes OVERDUE again after voiding the payment that had covered it', async () => {
    subscriptions.list.mockResolvedValue([buildSubscription(daysFromNow(20))]);
    await expect(resolve.execute('gym-1', buildMember())).resolves.toBe(MemberStatus.ACTIVE);

    // Voiding the payment recomputes paidUntil back to null (no PAID payments left).
    subscriptions.list.mockResolvedValue([buildSubscription(null)]);
    await expect(resolve.execute('gym-1', buildMember())).resolves.toBe(MemberStatus.ACTIVE);
  });

  it('treats a never-paid subscription (paidUntil null) as not overdue', async () => {
    subscriptions.list.mockResolvedValue([buildSubscription(null)]);

    await expect(resolve.execute('gym-1', buildMember())).resolves.toBe(MemberStatus.ACTIVE);
  });

  it('falls back to the default grace period when the gym has no settings row', async () => {
    gymSettings.findByGymId.mockResolvedValue(null);
    subscriptions.list.mockResolvedValue([buildSubscription(daysAgo(30))]);

    await expect(resolve.execute('gym-1', buildMember())).resolves.toBe(MemberStatus.OVERDUE);
  });
});
