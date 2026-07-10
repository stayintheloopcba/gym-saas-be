import { Column, Entity, Index } from 'typeorm';
import { PaymentMethod } from '../../../common/enums/payment-method.enum';
import { BaseEntity } from '../../../common/entities/base.entity';

export const DEFAULT_TIMEZONE = 'America/Argentina/Buenos_Aires';
export const DEFAULT_CURRENCY = 'ARS';
export const DEFAULT_MORA_GRACE_DAYS = 5;
export const DEFAULT_ENABLED_PAYMENT_METHODS: PaymentMethod[] = [PaymentMethod.CASH];

/**
 * Agregado `GymSettings`: configuración 1:1 de un `Gym`. Concentra el branding
 * que antes vivía en `Gym` (Decision #4 técnica) más los campos operativos
 * (timezone, moneda, mora, métodos de pago habilitados).
 *
 * Único `gymId` **entre settings no eliminados** (índice parcial): a lo sumo
 * una fila de settings activa por gym.
 */
@Index('uq_gym_settings_gym_active', ['gymId'], { unique: true, where: '"deleted_at" IS NULL' })
@Entity('gym_settings')
export class GymSettings extends BaseEntity {
  @Column({ name: 'gym_id', type: 'uuid' })
  public gymId: string;

  @Column({ name: 'display_name', type: 'varchar', length: 255, nullable: true })
  public displayName: string | null;

  @Column({ name: 'logo_url', type: 'varchar', length: 1024, nullable: true })
  public logoUrl: string | null;

  @Column({ name: 'banner_url', type: 'varchar', length: 1024, nullable: true })
  public bannerUrl: string | null;

  @Column({ name: 'primary_color', type: 'varchar', length: 7, nullable: true })
  public primaryColor: string | null;

  @Column({ name: 'secondary_color', type: 'varchar', length: 7, nullable: true })
  public secondaryColor: string | null;

  @Column({ name: 'font_family', type: 'varchar', length: 64, nullable: true })
  public fontFamily: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  public theme: string | null;

  @Column({ type: 'varchar', length: 64, default: DEFAULT_TIMEZONE })
  public timezone: string;

  @Column({ type: 'varchar', length: 8, default: DEFAULT_CURRENCY })
  public currency: string;

  @Column({ name: 'opening_hours', type: 'jsonb', nullable: true })
  public openingHours: Record<string, unknown> | null;

  @Column({ name: 'contact_email', type: 'varchar', length: 320, nullable: true })
  public contactEmail: string | null;

  @Column({ name: 'contact_phone', type: 'varchar', length: 32, nullable: true })
  public contactPhone: string | null;

  @Column({ name: 'mora_grace_days', type: 'int', default: DEFAULT_MORA_GRACE_DAYS })
  public moraGraceDays: number;

  @Column({ name: 'mora_surcharge_pct', type: 'numeric', precision: 5, scale: 2, default: 0 })
  public moraSurchargePct: number;

  @Column({ name: 'renewal_policy', type: 'jsonb', nullable: true })
  public renewalPolicy: Record<string, unknown> | null;

  @Column({ name: 'enabled_payment_methods', type: 'jsonb', default: () => `'["${PaymentMethod.CASH}"]'` })
  public enabledPaymentMethods: PaymentMethod[];
}
