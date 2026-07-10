import { Subscription } from '../../subscriptions/domain/subscription.entity';
import { SubscriptionRepository } from '../../subscriptions/domain/subscription.repository';
import { PaymentRepository } from '../domain/payment.repository';
import { RecomputePaidUntil } from './recompute-paid-until';

describe('RecomputePaidUntil', () => {
  let payments: jest.Mocked<Pick<PaymentRepository, 'maxPaidPeriodEnd'>>;
  let subscriptions: jest.Mocked<Pick<SubscriptionRepository, 'findById' | 'save'>>;
  let recompute: RecomputePaidUntil;

  beforeEach(() => {
    payments = { maxPaidPeriodEnd: jest.fn() };
    subscriptions = {
      findById: jest.fn().mockResolvedValue(Object.assign(new Subscription(), { id: 'sub-1', paidUntil: null })),
      save: jest.fn((s: Subscription) => Promise.resolve(s)),
    };
    recompute = new RecomputePaidUntil(
      payments as unknown as PaymentRepository,
      subscriptions as unknown as SubscriptionRepository,
    );
  });

  it('sets paidUntil to the max periodEnd among PAID payments', async () => {
    payments.maxPaidPeriodEnd.mockResolvedValue('2026-10-31');

    await recompute.execute('gym-1', 'sub-1');

    expect(subscriptions.save).toHaveBeenCalledWith(expect.objectContaining({ paidUntil: '2026-10-31' }));
  });

  it('sets paidUntil to null when there are no PAID payments left', async () => {
    payments.maxPaidPeriodEnd.mockResolvedValue(null);

    await recompute.execute('gym-1', 'sub-1');

    expect(subscriptions.save).toHaveBeenCalledWith(expect.objectContaining({ paidUntil: null }));
  });

  it('is a no-op when the subscription does not exist', async () => {
    subscriptions.findById.mockResolvedValue(null);

    await recompute.execute('gym-1', 'missing');

    expect(subscriptions.save).not.toHaveBeenCalled();
  });
});
