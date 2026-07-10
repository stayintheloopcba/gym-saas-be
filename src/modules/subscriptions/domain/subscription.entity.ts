import { Column, Entity, Index } from 'typeorm';
import { RenewalMode } from '../../../common/enums/renewal-mode.enum';
import { SubscriptionStatus } from '../../../common/enums/subscription-status.enum';
import { BaseEntity } from '../../../common/entities/base.entity';

/**
 * Agregado `Subscription`: suscripción de un `Member` a un `Plan`.
 * `paidUntil` es derivado (máx. `periodEnd` de pagos `PAID`) y lo recomputan
 * `payments` al crear/anular un pago (tareas 16/17); acá nunca se setea a mano.
 */
@Index('idx_subscriptions_member_status', ['memberId', 'status'])
@Entity('subscriptions')
export class Subscription extends BaseEntity {
  @Index()
  @Column({ name: 'gym_id', type: 'uuid' })
  public gymId: string;

  @Index()
  @Column({ name: 'member_id', type: 'uuid' })
  public memberId: string;

  @Column({ name: 'plan_id', type: 'uuid' })
  public planId: string;

  @Column({ name: 'start_date', type: 'date' })
  public startDate: string;

  /** `null` = indeterminada. */
  @Column({ name: 'end_date', type: 'date', nullable: true })
  public endDate: string | null;

  /** Derivado: base del cálculo de mora. Nunca se setea a mano. */
  @Column({ name: 'paid_until', type: 'date', nullable: true })
  public paidUntil: string | null;

  @Column({ type: 'enum', enum: SubscriptionStatus, default: SubscriptionStatus.ACTIVE })
  public status: SubscriptionStatus;

  @Column({ name: 'renewal_mode', type: 'enum', enum: RenewalMode, default: RenewalMode.MANUAL })
  public renewalMode: RenewalMode;
}
