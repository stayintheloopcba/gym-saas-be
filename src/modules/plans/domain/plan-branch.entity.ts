import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/** Sedes donde un `Plan` está habilitado (M:N). Un plan requiere >=1 sede. */
@Index('uq_plan_branches_active', ['planId', 'branchId'], { unique: true, where: '"deleted_at" IS NULL' })
@Entity('plan_branches')
export class PlanBranch extends BaseEntity {
  @Index()
  @Column({ name: 'gym_id', type: 'uuid' })
  public gymId: string;

  @Index()
  @Column({ name: 'plan_id', type: 'uuid' })
  public planId: string;

  @Index()
  @Column({ name: 'branch_id', type: 'uuid' })
  public branchId: string;
}
