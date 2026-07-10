import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/**
 * Agregado `RoutineAssignment`: asignación de una `Routine` a un `Member`.
 * `unassignedAt` `null` = activa. Un member no puede tener la misma rutina
 * activamente asignada dos veces (índice parcial único).
 */
@Index('uq_routine_assignments_active', ['gymId', 'memberId', 'routineId'], {
  unique: true,
  where: '"unassigned_at" IS NULL',
})
@Index('idx_routine_assignments_member', ['gymId', 'memberId'])
@Entity('routine_assignments')
export class RoutineAssignment extends BaseEntity {
  @Column({ name: 'gym_id', type: 'uuid' })
  public gymId: string;

  @Column({ name: 'member_id', type: 'uuid' })
  public memberId: string;

  @Column({ name: 'routine_id', type: 'uuid' })
  public routineId: string;

  @Column({ name: 'assigned_by_member_id', type: 'uuid', nullable: true })
  public assignedByMemberId: string | null;

  @Column({ name: 'assigned_at', type: 'timestamptz' })
  public assignedAt: Date;

  @Column({ name: 'unassigned_at', type: 'timestamptz', nullable: true })
  public unassignedAt: Date | null;
}
