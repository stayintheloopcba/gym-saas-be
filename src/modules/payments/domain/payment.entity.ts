import { Column, Entity, Index } from 'typeorm';
import { PaymentMethod } from '../../../common/enums/payment-method.enum';
import { PaymentStatus } from '../../../common/enums/payment-status.enum';
import { BaseEntity } from '../../../common/entities/base.entity';

/**
 * Agregado `Payment`: un pago cubre un período arbitrario `[periodStart,
 * periodEnd]` con `amount` libre (soporta pagar 1 o N meses de una vez). Sin
 * entidad de deuda/factura en MVP.
 */
@Index('idx_payments_member_paid_at', ['memberId', 'paidAt'])
@Entity('payments')
export class Payment extends BaseEntity {
  @Index()
  @Column({ name: 'gym_id', type: 'uuid' })
  public gymId: string;

  @Index()
  @Column({ name: 'member_id', type: 'uuid' })
  public memberId: string;

  @Index()
  @Column({ name: 'subscription_id', type: 'uuid', nullable: true })
  public subscriptionId: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  public amount: number;

  @Column({ type: 'varchar', length: 8 })
  public currency: string;

  @Column({ type: 'enum', enum: PaymentMethod })
  public method: PaymentMethod;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PAID })
  public status: PaymentStatus;

  @Column({ name: 'paid_at', type: 'timestamptz' })
  public paidAt: Date;

  @Column({ name: 'period_start', type: 'date' })
  public periodStart: string;

  @Column({ name: 'period_end', type: 'date' })
  public periodEnd: string;

  @Column({ name: 'late_fee', type: 'numeric', precision: 12, scale: 2, nullable: true })
  public lateFee: number | null;

  @Column({ type: 'jsonb', nullable: true })
  public metadata: Record<string, unknown> | null;
}
