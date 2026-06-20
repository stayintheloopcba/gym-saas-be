import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { MembershipRole } from '../../../common/enums/membership-role.enum';

@Index('uq_roles_org_name_active', ['organizationId', 'name'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
@Entity('roles')
export class Role extends BaseEntity {
  @Index()
  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  public organizationId: string | null;

  @Column({ type: 'varchar', length: 100 })
  public name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  public description?: string;

  @Index({ unique: true })
  @Column({ name: 'system_key', type: 'enum', enum: MembershipRole, nullable: true })
  public systemKey: MembershipRole | null;

  @Column({ name: 'is_system', type: 'boolean', default: false })
  public isSystem: boolean;

  @Column({ name: 'hierarchy_level', type: 'integer', default: 1 })
  public hierarchyLevel: number;
}
