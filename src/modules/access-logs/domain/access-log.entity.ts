import { Column, Entity, Index } from 'typeorm';
import { AccessResult } from '../../../common/enums/access-result.enum';
import { BaseEntity } from '../../../common/entities/base.entity';

/**
 * Agregado `AccessLog`: registro de check-in manual (staff). `DENIED` es un
 * resultado de negocio, no un error — el ingreso físico queda a criterio del
 * staff (Technical Decision #8).
 */
@Index('idx_access_logs_gym_timestamp', ['gymId', 'timestamp'])
@Index('idx_access_logs_member', ['memberId'])
@Index('idx_access_logs_gym_branch', ['gymId', 'branchId'])
@Entity('access_logs')
export class AccessLog extends BaseEntity {
  @Column({ name: 'gym_id', type: 'uuid' })
  public gymId: string;

  @Column({ name: 'member_id', type: 'uuid' })
  public memberId: string;

  @Column({ name: 'branch_id', type: 'uuid', nullable: true })
  public branchId: string | null;

  @Column({ type: 'timestamptz' })
  public timestamp: Date;

  @Column({ type: 'enum', enum: AccessResult })
  public result: AccessResult;

  @Column({ type: 'varchar', length: 64, nullable: true })
  public reason: string | null;
}
