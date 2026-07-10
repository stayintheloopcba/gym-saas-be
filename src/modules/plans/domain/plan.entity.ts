import { Column, Entity, Index } from 'typeorm';
import { Periodicity } from '../../../common/enums/periodicity.enum';
import { BaseEntity } from '../../../common/entities/base.entity';

/**
 * Agregado `Plan` (ex `MembershipPlan`), a nivel gym. El alcance por sede y
 * las disciplinas incluidas viven en `PlanBranch`/`PlanDiscipline` (M:N),
 * escritas a través de este módulo (write-through joins).
 */
@Entity('plans')
export class Plan extends BaseEntity {
  @Index()
  @Column({ name: 'gym_id', type: 'uuid' })
  public gymId: string;

  @Column({ type: 'varchar', length: 255 })
  public name: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  public price: number;

  @Column({ type: 'varchar', length: 8 })
  public currency: string;

  @Column({ type: 'enum', enum: Periodicity })
  public periodicity: Periodicity;

  /** `null` = ilimitado. */
  @Column({ name: 'visits_per_month', type: 'int', nullable: true })
  public visitsPerMonth: number | null;

  @Column({ name: 'time_window', type: 'jsonb', nullable: true })
  public timeWindow: Record<string, unknown> | null;

  @Column({ type: 'boolean', default: true })
  public active: boolean;
}
