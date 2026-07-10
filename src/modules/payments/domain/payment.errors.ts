import { DomainError } from '../../../common/errors/domain-error';

export class PaymentNotFoundError extends DomainError {
  readonly status = 404;

  constructor(identifier: string) {
    super(`Payment not found: ${identifier}`);
  }
}

/** El método de pago no está habilitado en `GymSettings.enabledPaymentMethods`. */
export class PaymentMethodNotEnabledError extends DomainError {
  readonly status = 409;

  constructor(method: string) {
    super(`Payment method not enabled for this gym: ${method}`);
  }
}
