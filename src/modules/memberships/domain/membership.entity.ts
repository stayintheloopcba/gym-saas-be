import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { MembershipRole } from '../../../common/enums/membership-role.enum';

/**
 * Agregado `Membership`: vincula un `User` con una `Organization` y le asigna un
 * `MembershipRole`. Un usuario puede pertenecer a varias organizaciones; una
 * organización tiene exactamente un `OWNER`.
 *
 * Hay como máximo una membresía **no eliminada** por par `(user, organization)`:
 * el índice único es parcial (`WHERE deleted_at IS NULL`), así un usuario removido
 * (soft delete) puede volver a ser agregado más adelante.
 */
@Index('uq_memberships_user_org_active', ['userId', 'organizationId'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
@Entity('memberships')
export class Membership extends BaseEntity {
  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  public userId: string;

  @Index()
  @Column({ name: 'organization_id', type: 'uuid' })
  public organizationId: string;

  @Column({ type: 'enum', enum: MembershipRole })
  public role: MembershipRole;

  @Index()
  @Column({ name: 'role_id', type: 'uuid', nullable: true })
  public roleId: string | null;
}
