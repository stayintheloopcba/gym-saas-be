import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { InvitationStatus } from '../../../common/enums/invitation-status.enum';

/**
 * Agregado `Invitation`: invita por email a alguien que aún no es miembro de una
 * organización, con un rol objetivo del catálogo global. Lleva un `token` opaco
 * (se busca al aceptar), un `status` y un `expiresAt` (`now + INVITATION_TTL`).
 *
 * Hereda de `BaseEntity`: UUID + auditoría + soft delete.
 */
@Index('idx_invitations_org_email', ['organizationId', 'email'])
@Entity('invitations')
export class Invitation extends BaseEntity {
  @Index()
  @Column({ name: 'organization_id', type: 'uuid' })
  public organizationId: string;

  /** Email del invitado (normalizado lowercase). */
  @Column({ type: 'varchar', length: 320 })
  public email: string;

  @Index()
  @Column({ name: 'role_id', type: 'uuid' })
  public roleId: string;

  /** Token opaco (`crypto.randomBytes`), único; se entrega al invitado. */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 128 })
  public token: string;

  @Column({ type: 'enum', enum: InvitationStatus, default: InvitationStatus.PENDING })
  public status: InvitationStatus;

  @Column({ name: 'expires_at', type: 'timestamp with time zone' })
  public expiresAt: Date;
}
