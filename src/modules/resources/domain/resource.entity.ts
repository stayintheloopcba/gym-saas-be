import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ResourceStatus } from './resource-status.enum';

@Index('idx_resources_org_status_active', ['organizationId', 'status'], {
  where: '"deleted_at" IS NULL',
})
@Entity('resources')
export class Resource extends BaseEntity {
  @Index()
  @Column({ name: 'organization_id', type: 'uuid' })
  public organizationId: string;

  @Column({ type: 'varchar', length: 255 })
  public name: string;

  @Column({ type: 'text', nullable: true })
  public description?: string;

  @Column({ type: 'enum', enum: ResourceStatus, default: ResourceStatus.ACTIVE })
  public status: ResourceStatus;
}
