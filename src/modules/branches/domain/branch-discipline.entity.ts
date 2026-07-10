import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/**
 * Agregado `BranchDiscipline` (M:N branch × discipline): qué disciplina
 * ofrece cada sede. `gymId` es solo aislamiento multi-tenant (la sede y la
 * disciplina ya determinan la fila).
 */
@Index('uq_branch_disciplines_active', ['branchId', 'disciplineId'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
@Entity('branch_disciplines')
export class BranchDiscipline extends BaseEntity {
  @Index()
  @Column({ name: 'gym_id', type: 'uuid' })
  public gymId: string;

  @Index()
  @Column({ name: 'branch_id', type: 'uuid' })
  public branchId: string;

  @Index()
  @Column({ name: 'discipline_id', type: 'uuid' })
  public disciplineId: string;

  @Column({ type: 'boolean', default: true })
  public active: boolean;
}
