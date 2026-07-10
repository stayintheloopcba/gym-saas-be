import { Inject, Injectable } from '@nestjs/common';
import { PAYMENT_REPOSITORY } from '../domain/payment.repository';
import type { PaymentRepository } from '../domain/payment.repository';
import { SUBSCRIPTION_REPOSITORY } from '../../subscriptions/domain/subscription.repository';
import type { SubscriptionRepository } from '../../subscriptions/domain/subscription.repository';

/**
 * Recomputa `Subscription.paidUntil` como `MAX(periodEnd)` entre los pagos
 * `PAID` de la suscripción — nunca se decrementa/incrementa a mano. Se
 * invoca tras crear o anular un pago (Technical Decision #6).
 */
@Injectable()
export class RecomputePaidUntil {
  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly payments: PaymentRepository,
    @Inject(SUBSCRIPTION_REPOSITORY) private readonly subscriptions: SubscriptionRepository,
  ) {}

  async execute(gymId: string, subscriptionId: string): Promise<void> {
    const subscription = await this.subscriptions.findById(gymId, subscriptionId);
    if (!subscription) {
      return;
    }

    subscription.paidUntil = await this.payments.maxPaidPeriodEnd(subscriptionId);
    await this.subscriptions.save(subscription);
  }
}
