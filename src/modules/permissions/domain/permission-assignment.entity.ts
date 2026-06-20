import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Permission } from './permission.entity';
import { Role } from './role.entity';

/**
 * Asignación de un permiso a un **rol** o a un **usuario**, siempre dentro de una
 * organización. Generaliza el antiguo `RolePermission` para soportar grants a
 * nivel usuario (overrides) además de los de rol, con allow/deny (`value`) y
 * `precedence` para resolver conflictos en el motor de evaluación.
 *
 * Invariante: exactamente uno de (`userId`, `roleId`) es no nulo (rol XOR usuario),
 * garantizado por el `@Check` a nivel base de datos.
 *
 * El baseline de los roles de sistema NO se persiste acá: vive en
 * `DEFAULT_ROLE_PERMISSIONS` (en memoria). Esta tabla es la capa de overrides
 * (roles custom + grants/denies de usuario), por eso `organizationId` es no nulo.
 */
@Check('chk_permission_assignment_subject', '("user_id" IS NOT NULL) <> ("role_id" IS NOT NULL)')
@Index('uq_permission_assignments_subject_code_active', ['organizationId', 'userId', 'roleId', 'permissionCode'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
@Entity('permission_assignments')
export class PermissionAssignment extends BaseEntity {
  @Index()
  @Column({ name: 'organization_id', type: 'uuid' })
  public organizationId: string;

  /** Sujeto usuario (grant a nivel usuario). Nulo cuando la asignación es de rol. */
  @Index()
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  public userId: string | null;

  /** Sujeto rol (grant a nivel rol). Nulo cuando la asignación es de usuario. */
  @Index()
  @Column({ name: 'role_id', type: 'uuid', nullable: true })
  public roleId: string | null;

  @Index()
  @Column({ name: 'permission_code', type: 'varchar', length: 120 })
  public permissionCode: string;

  /** `true` = allow, `false` = deny explícito. */
  @Column({ type: 'boolean', default: true })
  public value: boolean;

  @Column({ type: 'integer', default: 5 })
  public precedence: number;

  @ManyToOne(() => Role, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'role_id' })
  public role?: Role;

  @ManyToOne(() => Permission, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_code', referencedColumnName: 'code' })
  public permission: Permission;
}
