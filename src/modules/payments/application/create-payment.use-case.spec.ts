import { PaymentMethod } from '../../../common/enums/payment-method.enum';
import { GymSettings } from '../../gym-settings/domain/gym-settings.entity';
import { GymSettingsRepository } from '../../gym-settings/domain/gym-settings.repository';
import { Member } from '../../members/domain/member.entity';
import { MemberNotFoundError } from '../../members/domain/member.errors';
import { MemberRepository } from '../../members/domain/member.repository';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { Subscription } from '../../subscriptions/domain/subscription.entity';
import { SubscriptionNotFoundError } from '../../subscriptions/domain/subscription.errors';
import { SubscriptionRepository } from '../../subscriptions/domain/subscription.repository';
import { Payment } from '../domain/payment.entity';
import { PaymentMethodNotEnabledError } from '../domain/payment.errors';
import { PaymentRepository } from '../domain/payment.repository';
import { CreatePaymentUseCase } from './create-payment.use-case';
import { RecomputePaidUntil } from './recompute-paid-until';

describe('CreatePaymentUseCase', () => {
  let payments: jest.Mocked<Pick<PaymentRepository, 'save'>>;
  let members: jest.Mocked<Pick<MemberRepository, 'findById'>>;
  let subscriptions: jest.Mocked<Pick<SubscriptionRepository, 'findById'>>;
  let gymSettings: jest.Mocked<Pick<GymSettingsRepository, 'findByGymId'>>;
  let recomputePaidUntil: jest.Mocked<Pick<RecomputePaidUntil, 'execute'>>;
  let permissions: jest.Mocked<Pick<GymPermissionService, 'requirePermission'>>;
  let useCase: CreatePaymentUseCase;

  beforeEach(() => {
    payments = { save: jest.fn((p: Payment) => Promise.resolve(Object.assign(p, { id: 'payment-1' }))) };
    members = { findById: jest.fn().mockResolvedValue(Object.assign(new Member(), { id: 'member-1' })) };
    subscriptions = {
      findById: jest.fn().mockResolvedValue(Object.assign(new Subscription(), { id: 'sub-1' })),
    };
    gymSettings = {
      findByGymId: jest
        .fn()
        .mockResolvedValue(
          Object.assign(new GymSettings(), { currency: 'ARS', enabledPaymentMethods: [PaymentMethod.CASH] }),
        ),
    };
    recomputePaidUntil = { execute: jest.fn().mockResolvedValue(undefined) };
    permissions = { requirePermission: jest.fn().mockResolvedValue(undefined) };
    useCase = new CreatePaymentUseCase(
      payments as unknown as PaymentRepository,
      members as unknown as MemberRepository,
      subscriptions as unknown as SubscriptionRepository,
      gymSettings as unknown as GymSettingsRepository,
      recomputePaidUntil as unknown as RecomputePaidUntil,
      permissions as unknown as GymPermissionService,
    );
  });

  it('records a payment and recomputes paidUntil when linked to a subscription', async () => {
    const view = await useCase.execute({
      callerUserId: 'admin',
      gymId: 'gym-1',
      memberId: 'member-1',
      subscriptionId: 'sub-1',
      amount: 15000,
      method: PaymentMethod.CASH,
      periodStart: '2026-10-01',
      periodEnd: '2026-10-31',
    });

    expect(view.status).toBe('PAID');
    expect(view.currency).toBe('ARS');
    expect(recomputePaidUntil.execute).toHaveBeenCalledWith('gym-1', 'sub-1');
  });

  it('skips recompute when not linked to a subscription', async () => {
    await useCase.execute({
      callerUserId: 'admin',
      gymId: 'gym-1',
      memberId: 'member-1',
      amount: 15000,
      method: PaymentMethod.CASH,
      periodStart: '2026-10-01',
      periodEnd: '2026-10-31',
    });

    expect(recomputePaidUntil.execute).not.toHaveBeenCalled();
  });

  it('throws MemberNotFoundError when the member does not exist', async () => {
    members.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        callerUserId: 'admin',
        gymId: 'gym-1',
        memberId: 'missing',
        amount: 1,
        method: PaymentMethod.CASH,
        periodStart: '2026-10-01',
        periodEnd: '2026-10-31',
      }),
    ).rejects.toBeInstanceOf(MemberNotFoundError);
  });

  it('throws SubscriptionNotFoundError for an unknown subscriptionId', async () => {
    subscriptions.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        callerUserId: 'admin',
        gymId: 'gym-1',
        memberId: 'member-1',
        subscriptionId: 'missing',
        amount: 1,
        method: PaymentMethod.CASH,
        periodStart: '2026-10-01',
        periodEnd: '2026-10-31',
      }),
    ).rejects.toBeInstanceOf(SubscriptionNotFoundError);
  });

  it('rejects a method not enabled for the gym', async () => {
    await expect(
      useCase.execute({
        callerUserId: 'admin',
        gymId: 'gym-1',
        memberId: 'member-1',
        amount: 1,
        method: PaymentMethod.TRANSFER,
        periodStart: '2026-10-01',
        periodEnd: '2026-10-31',
      }),
    ).rejects.toBeInstanceOf(PaymentMethodNotEnabledError);
  });

  it('falls back to default currency/methods when the gym has no settings row', async () => {
    gymSettings.findByGymId.mockResolvedValue(null);

    const view = await useCase.execute({
      callerUserId: 'admin',
      gymId: 'gym-1',
      memberId: 'member-1',
      amount: 1,
      method: PaymentMethod.CASH,
      periodStart: '2026-10-01',
      periodEnd: '2026-10-31',
    });

    expect(view.currency).toBe('ARS');
  });
});
