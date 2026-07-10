import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/** Ejercicio de una `Routine`. Se reemplaza como set completo (`PATCH`). */
@Index('idx_routine_items_routine', ['routineId'])
@Entity('routine_items')
export class RoutineItem extends BaseEntity {
  @Index()
  @Column({ name: 'gym_id', type: 'uuid' })
  public gymId: string;

  @Column({ name: 'routine_id', type: 'uuid' })
  public routineId: string;

  @Column({ name: 'exercise_name', type: 'varchar', length: 255 })
  public exerciseName: string;

  @Column({ type: 'int' })
  public sets: number;

  /** Texto libre, p. ej. `"8-12"`. */
  @Column({ type: 'varchar', length: 32 })
  public reps: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  public notes: string | null;

  @Column({ type: 'int' })
  public order: number;
}
