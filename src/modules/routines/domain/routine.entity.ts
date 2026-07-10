import { Column, Entity, Index } from 'typeorm';
import { RoutineScope } from '../../../common/enums/routine-scope.enum';
import { BaseEntity } from '../../../common/entities/base.entity';

/**
 * Agregado `Routine`: `TEMPLATE` (precargada del gym, sin owner) o
 * `PERSONAL` (de un socio, con `ownerMemberId`). `createdByMemberId` es el
 * autor (el profe o el propio alumno).
 */
@Index('idx_routines_gym', ['gymId'])
@Entity('routines')
export class Routine extends BaseEntity {
  @Column({ name: 'gym_id', type: 'uuid' })
  public gymId: string;

  @Column({ type: 'enum', enum: RoutineScope })
  public scope: RoutineScope;

  /** `null` si `TEMPLATE`; requerido si `PERSONAL`. */
  @Column({ name: 'owner_member_id', type: 'uuid', nullable: true })
  public ownerMemberId: string | null;

  @Column({ name: 'created_by_member_id', type: 'uuid', nullable: true })
  public createdByMemberId: string | null;

  @Column({ type: 'varchar', length: 255 })
  public name: string;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  public notes: string | null;

  @Column({ type: 'boolean', default: true })
  public active: boolean;
}
