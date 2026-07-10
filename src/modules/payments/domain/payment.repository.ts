import { Payment } from './payment.entity';

export const PAYMENT_REPOSITORY = Symbol('PAYMENT_REPOSITORY');

export interface PaymentListFilters {
  memberId?: string;
  from?: string;
  to?: string;
}

export interface PaymentRepository {
  findById(gymId: string, id: string): Promise<Payment | null>;
  list(gymId: string, filters: PaymentListFilters): Promise<Payment[]>;
  save(payment: Payment): Promise<Payment>;
  /** `MAX(periodEnd)` entre los pagos `PAID` de la suscripción, o `null` si no hay ninguno. */
  maxPaidPeriodEnd(subscriptionId: string): Promise<string | null>;
}
