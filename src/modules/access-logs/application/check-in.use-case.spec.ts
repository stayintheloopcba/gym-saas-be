import { SubscriptionStatus } from '../../../common/enums/subscription-status.enum';
import { ResolveMemberStatus } from '../../members/application/resolve-member-status';
import { MemberStatus } from '../../members/domain/member-status.enum';
import { Member } from '../../members/domain/member.entity';
import { MemberNotFoundError } from '../../members/domain/member.errors';
import { MemberRepository } from '../../members/domain/member.repository';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { Subscription } from '../../subscriptions/domain/subscription.entity';
import { SubscriptionRepository } from '../../subscriptions/domain/subscription.repository';
import { AccessLog } from '../domain/access-log.entity';
import { AccessLogRepository } from '../domain/access-log.repository';
import { CheckInUseCase } from './check-in.use-case';

describe('CheckInUseCase', () => {
  let accessLogs: jest.Mocked<Pick<AccessLogRepository, 'save'>>;
  let members: jest.Mocked<Pick<MemberRepository, 'findById'>>;
  let subscriptions: jest.Mocked<Pick<SubscriptionRepository, 'list'>>;
  let resolveMemberStatus: jest.Mocked<Pick<ResolveMemberStatus, 'execute'>>;
  let permissions: jest.Mocked<Pick<GymPermissionService, 'requirePermission'>>;
  let useCase: CheckInUseCase;

  beforeEach(() => {
    accessLogs = { save: jest.fn((log: AccessLog) => Promise.resolve(Object.assign(log, { id: 'log-1' }))) };
    members = { findById: jest.fn().mockResolvedValue(Object.assign(new Member(), { id: 'member-1' })) };
    subscriptions = {
      list: jest
        .fn()
        .mockResolvedValue([Object.assign(new Subscription(), { status: SubscriptionStatus.ACTIVE, endDate: null })]),
    };
    resolveMemberStatus = { execute: jest.fn().mockResolvedValue(MemberStatus.ACTIVE) };
    permissions = { requirePermission: jest.fn().mockResolvedValue(undefined) };
    useCase = new CheckInUseCase(
      accessLogs as unknown as AccessLogRepository,
      members as unknown as MemberRepository,
      subscriptions as unknown as SubscriptionRepository,
      resolveMemberStatus as unknown as ResolveMemberStatus,
      permissions as unknown as GymPermissionService,
    );
  });

  it('grants access when there is a valid subscription and the member is not overdue', async () => {
    const view = await useCase.execute({ callerUserId: 'staff', gymId: 'gym-1', memberId: 'member-1' });

    expect(view.result).toBe('GRANTED');
    expect(view.reason).toBeNull();
  });

  it('denies with reason "expired" when there is no valid active subscription', async () => {
    subscriptions.list.mockResolvedValue([]);

    const view = await useCase.execute({ callerUserId: 'staff', gymId: 'gym-1', memberId: 'member-1' });

    expect(view.result).toBe('DENIED');
    expect(view.reason).toBe('expired');
  });

  it('denies with reason "expired" when the only active subscription already ended', async () => {
    subscriptions.list.mockResolvedValue([
      Object.assign(new Subscription(), { status: SubscriptionStatus.ACTIVE, endDate: '2020-01-01' }),
    ]);

    const view = await useCase.execute({ callerUserId: 'staff', gymId: 'gym-1', memberId: 'member-1' });

    expect(view.reason).toBe('expired');
  });

  it('denies with reason "overdue" when the member is derived OVERDUE', async () => {
    resolveMemberStatus.execute.mockResolvedValue(MemberStatus.OVERDUE);

    const view = await useCase.execute({ callerUserId: 'staff', gymId: 'gym-1', memberId: 'member-1' });

    expect(view.result).toBe('DENIED');
    expect(view.reason).toBe('overdue');
  });

  it('always creates the access log record even when denied (never throws)', async () => {
    subscriptions.list.mockResolvedValue([]);

    await useCase.execute({ callerUserId: 'staff', gymId: 'gym-1', memberId: 'member-1' });

    expect(accessLogs.save).toHaveBeenCalled();
  });

  it('throws MemberNotFoundError when the member does not exist', async () => {
    members.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ callerUserId: 'staff', gymId: 'gym-1', memberId: 'missing' }),
    ).rejects.toBeInstanceOf(MemberNotFoundError);
    expect(accessLogs.save).not.toHaveBeenCalled();
  });
});
