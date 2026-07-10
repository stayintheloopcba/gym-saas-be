import { PaymentMethod } from '../../../common/enums/payment-method.enum';
import { PaymentStatus } from '../../../common/enums/payment-status.enum';
import { Payment } from '../domain/payment.entity';

export interface PaymentView {
  id: string;
  gymId: string;
  memberId: string;
  subscriptionId: string | null;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt: Date;
  periodStart: string;
  periodEnd: string;
  lateFee: number | null;
  metadata: Record<string, unknown> | null;
}

export function toPaymentView(payment: Payment): PaymentView {
  return {
    id: payment.id,
    gymId: payment.gymId,
    memberId: payment.memberId,
    subscriptionId: payment.subscriptionId,
    amount: Number(payment.amount),
    currency: payment.currency,
    method: payment.method,
    status: payment.status,
    paidAt: payment.paidAt,
    periodStart: payment.periodStart,
    periodEnd: payment.periodEnd,
    lateFee: payment.lateFee === null ? null : Number(payment.lateFee),
    metadata: payment.metadata,
  };
}
