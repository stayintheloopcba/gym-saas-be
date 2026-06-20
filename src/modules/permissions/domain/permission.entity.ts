import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('permissions')
export class Permission extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 120, unique: true })
  public code: string;

  @Column({ type: 'varchar', length: 255 })
  public name: string;

  @Column({ type: 'text', nullable: true })
  public description: string;

  @Index()
  @Column({ name: 'is_active', type: 'boolean', default: true })
  public isActive: boolean;
}
