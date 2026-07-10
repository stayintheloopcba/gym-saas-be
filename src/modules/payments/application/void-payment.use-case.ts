import { Inject, Injectable } from '@nestjs/common';
import { PaymentStatus } from '../../../common/enums/payment-status.enum';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { PaymentNotFoundError } from '../domain/payment.errors';
import { PAYMENT_REPOSITORY } from '../domain/payment.repository';
import type { PaymentRepository } from '../domain/payment.repository';
import { PaymentView, toPaymentView } from '../interfaces/payment.view';
import { RecomputePaidUntil } from './recompute-paid-until';

/** Anula un pago. `paidUntil` se recomputa desde los pagos `PAID` restantes (nunca se decrementa a mano). */
@Injectable()
export class VoidPaymentUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly payments: PaymentRepository,
    private readonly recomputePaidUntil: RecomputePaidUntil,
    private readonly permissions: GymPermissionService,
  ) {}

  async execute(callerUserId: string, gymId: string, paymentId: string): Promise<PaymentView> {
    await this.permissions.requirePermission(callerUserId, gymId, PERMISSIONS.PAYMENTS_VOID);

    const payment = await this.payments.findById(gymId, paymentId);
    if (!payment) {
      throw new PaymentNotFoundError(paymentId);
    }

    payment.status = PaymentStatus.VOID;
    const saved = await this.payments.save(payment);

    if (saved.subscriptionId) {
      await this.recomputePaidUntil.execute(gymId, saved.subscriptionId);
    }

    return toPaymentView(saved);
  }
}
