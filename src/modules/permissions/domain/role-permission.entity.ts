import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Permission } from './permission.entity';
import { Role } from './role.entity';

/**
 * Permiso concedido a un rol del catálogo. La presencia de una fila
 * `(roleId, permissionCode)` significa que el rol otorga ese permiso: no hay
 * deny, ni grants a nivel usuario, ni precedencia.
 */
@Index('uq_role_permissions_role_code_active', ['roleId', 'permissionCode'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
@Entity('role_permissions')
export class RolePermission extends BaseEntity {
  @Index()
  @Column({ name: 'role_id', type: 'uuid' })
  public roleId: string;

  @Index()
  @Column({ name: 'permission_code', type: 'varchar', length: 120 })
  public permissionCode: string;

  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  public role?: Role;

  @ManyToOne(() => Permission, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_code', referencedColumnName: 'code' })
  public permission?: Permission;
}
