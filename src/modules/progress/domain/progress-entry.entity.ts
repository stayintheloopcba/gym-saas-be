import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/**
 * Agregado `ProgressEntry`: una marca de progreso de entrenamiento
 * (carga/marca) de un `Member`, opcionalmente contra un `RoutineItem`
 * puntual.
 */
@Index('idx_progress_entries_member_recorded', ['gymId', 'memberId', 'recordedAt'])
@Entity('progress_entries')
export class ProgressEntry extends BaseEntity {
  @Column({ name: 'gym_id', type: 'uuid' })
  public gymId: string;

  @Column({ name: 'member_id', type: 'uuid' })
  public memberId: string;

  @Column({ name: 'routine_item_id', type: 'uuid', nullable: true })
  public routineItemId: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  public value: number;

  @Column({ type: 'int', nullable: true })
  public reps: number | null;

  @Column({ name: 'recorded_at', type: 'timestamptz' })
  public recordedAt: Date;
}
