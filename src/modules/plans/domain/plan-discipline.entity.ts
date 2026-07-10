import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/**
 * Disciplinas incluidas en un `Plan` (M:N). Cada una debe estar ofrecida
 * (`BranchDiscipline.active`) en las sedes del plan.
 */
@Index('uq_plan_disciplines_active', ['planId', 'disciplineId'], { unique: true, where: '"deleted_at" IS NULL' })
@Entity('plan_disciplines')
export class PlanDiscipline extends BaseEntity {
  @Index()
  @Column({ name: 'gym_id', type: 'uuid' })
  public gymId: string;

  @Index()
  @Column({ name: 'plan_id', type: 'uuid' })
  public planId: string;

  @Index()
  @Column({ name: 'discipline_id', type: 'uuid' })
  public disciplineId: string;
}
