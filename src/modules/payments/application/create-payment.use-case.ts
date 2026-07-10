import { Inject, Injectable } from '@nestjs/common';
import { PaymentMethod } from '../../../common/enums/payment-method.enum';
import { PaymentStatus } from '../../../common/enums/payment-status.enum';
import { DEFAULT_CURRENCY, DEFAULT_ENABLED_PAYMENT_METHODS } from '../../gym-settings/domain/gym-settings.entity';
import { GYM_SETTINGS_REPOSITORY } from '../../gym-settings/domain/gym-settings.repository';
import type { GymSettingsRepository } from '../../gym-settings/domain/gym-settings.repository';
import { MemberNotFoundError } from '../../members/domain/member.errors';
import { MEMBER_REPOSITORY } from '../../members/domain/member.repository';
import type { MemberRepository } from '../../members/domain/member.repository';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { SubscriptionNotFoundError } from '../../subscriptions/domain/subscription.errors';
import { SUBSCRIPTION_REPOSITORY } from '../../subscriptions/domain/subscription.repository';
import type { SubscriptionRepository } from '../../subscriptions/domain/subscription.repository';
import { Payment } from '../domain/payment.entity';
import { PaymentMethodNotEnabledError } from '../domain/payment.errors';
import { PAYMENT_REPOSITORY } from '../domain/payment.repository';
import type { PaymentRepository } from '../domain/payment.repository';
import { PaymentView, toPaymentView } from '../interfaces/payment.view';
import { RecomputePaidUntil } from './recompute-paid-until';

export interface CreatePaymentCommand {
  callerUserId: string;
  gymId: string;
  memberId: string;
  subscriptionId?: string;
  amount: number;
  method: PaymentMethod;
  periodStart: string;
  periodEnd: string;
  lateFee?: number;
  metadata?: Record<string, unknown>;
}

/** Registra un pago. 409 si el método no está habilitado para el gym. */
@Injectable()
export class CreatePaymentUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly payments: PaymentRepository,
    @Inject(MEMBER_REPOSITORY) private readonly members: MemberRepository,
    @Inject(SUBSCRIPTION_REPOSITORY) private readonly subscriptions: SubscriptionRepository,
    @Inject(GYM_SETTINGS_REPOSITORY) private readonly gymSettings: GymSettingsRepository,
    private readonly recomputePaidUntil: RecomputePaidUntil,
    private readonly permissions: GymPermissionService,
  ) {}

  async execute(command: CreatePaymentCommand): Promise<PaymentView> {
    await this.permissions.requirePermission(command.callerUserId, command.gymId, PERMISSIONS.PAYMENTS_RECORD);

    const member = await this.members.findById(command.gymId, command.memberId);
    if (!member) {
      throw new MemberNotFoundError(command.memberId);
    }

    if (command.subscriptionId) {
      const subscription = await this.subscriptions.findById(command.gymId, command.subscriptionId);
      if (!subscription) {
        throw new SubscriptionNotFoundError(command.subscriptionId);
      }
    }

    const settings = await this.gymSettings.findByGymId(command.gymId);
    const enabledMethods = settings?.enabledPaymentMethods ?? DEFAULT_ENABLED_PAYMENT_METHODS;
    if (!enabledMethods.includes(command.method)) {
      throw new PaymentMethodNotEnabledError(command.method);
    }

    const payment = new Payment();
    payment.gymId = command.gymId;
    payment.memberId = command.memberId;
    payment.subscriptionId = command.subscriptionId ?? null;
    payment.amount = command.amount;
    payment.currency = settings?.currency ?? DEFAULT_CURRENCY;
    payment.method = command.method;
    payment.status = PaymentStatus.PAID;
    payment.paidAt = new Date();
    payment.periodStart = command.periodStart;
    payment.periodEnd = command.periodEnd;
    payment.lateFee = command.lateFee ?? null;
    payment.metadata = command.metadata ?? null;

    const saved = await this.payments.save(payment);

    if (saved.subscriptionId) {
      await this.recomputePaidUntil.execute(command.gymId, saved.subscriptionId);
    }

    return toPaymentView(saved);
  }
}
