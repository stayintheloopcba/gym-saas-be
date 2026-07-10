import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { Payment } from '../domain/payment.entity';
import { PaymentRepository } from '../domain/payment.repository';
import { ListPaymentsUseCase } from './list-payments.use-case';

describe('ListPaymentsUseCase', () => {
  it('forwards filters and maps to views', async () => {
    const payments: jest.Mocked<Pick<PaymentRepository, 'list'>> = {
      list: jest.fn().mockResolvedValue([Object.assign(new Payment(), { id: 'p1', amount: '100.00' })]),
    };
    const permissions: jest.Mocked<Pick<GymPermissionService, 'requirePermission'>> = {
      requirePermission: jest.fn().mockResolvedValue(undefined),
    };
    const useCase = new ListPaymentsUseCase(
      payments as unknown as PaymentRepository,
      permissions as unknown as GymPermissionService,
    );

    const views = await useCase.execute('admin', 'gym-1', { memberId: 'member-1' });

    expect(payments.list).toHaveBeenCalledWith('gym-1', { memberId: 'member-1' });
    expect(views[0].amount).toBe(100);
  });
});
