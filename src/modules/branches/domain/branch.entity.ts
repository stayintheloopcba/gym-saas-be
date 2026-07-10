import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/**
 * Agregado `Branch`: sede física de un `Gym`. Un gym tiene 1..N sedes.
 * `capacity`/`openingHours` son informativos en el MVP (sin reservas).
 */
@Entity('branches')
export class Branch extends BaseEntity {
  @Index()
  @Column({ name: 'gym_id', type: 'uuid' })
  public gymId: string;

  @Column({ type: 'varchar', length: 255 })
  public name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  public address: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  public phone: string | null;

  @Column({ name: 'opening_hours', type: 'jsonb', nullable: true })
  public openingHours: Record<string, unknown> | null;

  @Column({ type: 'int', nullable: true })
  public capacity: number | null;

  @Column({ type: 'boolean', default: true })
  public active: boolean;
}
