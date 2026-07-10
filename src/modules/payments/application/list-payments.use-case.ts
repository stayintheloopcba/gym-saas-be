import { Inject, Injectable } from '@nestjs/common';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { PaymentListFilters, PAYMENT_REPOSITORY } from '../domain/payment.repository';
import type { PaymentRepository } from '../domain/payment.repository';
import { PaymentView, toPaymentView } from '../interfaces/payment.view';

@Injectable()
export class ListPaymentsUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly payments: PaymentRepository,
    private readonly permissions: GymPermissionService,
  ) {}

  async execute(callerUserId: string, gymId: string, filters: PaymentListFilters): Promise<PaymentView[]> {
    await this.permissions.requirePermission(callerUserId, gymId, PERMISSIONS.PAYMENTS_READ);

    const payments = await this.payments.list(gymId, filters);
    return payments.map(toPaymentView);
  }
}
