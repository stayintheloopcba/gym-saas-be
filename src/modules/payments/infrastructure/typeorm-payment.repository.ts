import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentStatus } from '../../../common/enums/payment-status.enum';
import { Payment } from '../domain/payment.entity';
import { PaymentListFilters, PaymentRepository } from '../domain/payment.repository';

@Injectable()
export class TypeOrmPaymentRepository implements PaymentRepository {
  constructor(@InjectRepository(Payment) private readonly repo: Repository<Payment>) {}

  findById(gymId: string, id: string): Promise<Payment | null> {
    return this.repo.findOne({ where: { id, gymId } });
  }

  list(gymId: string, filters: PaymentListFilters): Promise<Payment[]> {
    const qb = this.repo.createQueryBuilder('payment').where('payment.gym_id = :gymId', { gymId });

    if (filters.memberId) {
      qb.andWhere('payment.member_id = :memberId', { memberId: filters.memberId });
    }
    if (filters.from) {
      qb.andWhere('payment.paid_at >= :from', { from: filters.from });
    }
    if (filters.to) {
      qb.andWhere('payment.paid_at <= :to', { to: filters.to });
    }

    return qb.orderBy('payment.paid_at', 'DESC').getMany();
  }

  save(payment: Payment): Promise<Payment> {
    return this.repo.save(payment);
  }

  async maxPaidPeriodEnd(subscriptionId: string): Promise<string | null> {
    const row = await this.repo
      .createQueryBuilder('payment')
      .select('MAX(payment.period_end)', 'max')
      .where('payment.subscription_id = :subscriptionId', { subscriptionId })
      .andWhere('payment.status = :status', { status: PaymentStatus.PAID })
      .getRawOne<{ max: string | null }>();
    return row?.max ?? null;
  }
}
