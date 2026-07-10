/**
 * Métodos de pago soportados. Un pago (`payments`) solo puede usar un método
 * habilitado en `GymSettings.enabledPaymentMethods`.
 */
export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  TRANSFER = 'TRANSFER',
}
