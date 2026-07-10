import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { Payment } from '../domain/payment.entity';
import { PaymentNotFoundError } from '../domain/payment.errors';
import { PaymentRepository } from '../domain/payment.repository';
import { RecomputePaidUntil } from './recompute-paid-until';
import { VoidPaymentUseCase } from './void-payment.use-case';

describe('VoidPaymentUseCase', () => {
  let payments: jest.Mocked<Pick<PaymentRepository, 'findById' | 'save'>>;
  let recomputePaidUntil: jest.Mocked<Pick<RecomputePaidUntil, 'execute'>>;
  let permissions: jest.Mocked<Pick<GymPermissionService, 'requirePermission'>>;
  let useCase: VoidPaymentUseCase;

  beforeEach(() => {
    payments = {
      findById: jest.fn().mockResolvedValue(Object.assign(new Payment(), { id: 'payment-1', subscriptionId: 'sub-1' })),
      save: jest.fn((p: Payment) => Promise.resolve(p)),
    };
    recomputePaidUntil = { execute: jest.fn().mockResolvedValue(undefined) };
    permissions = { requirePermission: jest.fn().mockResolvedValue(undefined) };
    useCase = new VoidPaymentUseCase(
      payments as unknown as PaymentRepository,
      recomputePaidUntil as unknown as RecomputePaidUntil,
      permissions as unknown as GymPermissionService,
    );
  });

  it('voids the payment and recomputes paidUntil', async () => {
    const view = await useCase.execute('admin', 'gym-1', 'payment-1');

    expect(view.status).toBe('VOID');
    expect(recomputePaidUntil.execute).toHaveBeenCalledWith('gym-1', 'sub-1');
  });

  it('skips recompute when the payment has no subscription', async () => {
    payments.findById.mockResolvedValue(Object.assign(new Payment(), { id: 'payment-1', subscriptionId: null }));

    await useCase.execute('admin', 'gym-1', 'payment-1');

    expect(recomputePaidUntil.execute).not.toHaveBeenCalled();
  });

  it('throws PaymentNotFoundError when missing', async () => {
    payments.findById.mockResolvedValue(null);

    await expect(useCase.execute('admin', 'gym-1', 'missing')).rejects.toBeInstanceOf(PaymentNotFoundError);
  });
});
