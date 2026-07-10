import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { MemberStatus } from './member-status.enum';

/**
 * Agregado `Member`: la persona (alumno o empleado) dentro de un gym.
 * Reemplaza a `Membership` + los datos personales que hoy viven en `User`.
 *
 * `userId` es **nullable**: un Member puede existir sin cuenta de acceso
 * (alumno que nunca usa el portal). `branchId` nullable = puede ir a
 * cualquier sede. `status` guarda como máximo `ACTIVE/SUSPENDED/INACTIVE`;
 * `OVERDUE` se deriva en lectura, nunca se persiste (ver `MemberView`).
 *
 * Como máximo un Member no eliminado por `(gym, user)` y por `(gym, documentId)`:
 * ambos índices son parciales (`WHERE deleted_at IS NULL`).
 */
@Index('uq_members_gym_user_active', ['gymId', 'userId'], {
  unique: true,
  where: '"deleted_at" IS NULL AND "user_id" IS NOT NULL',
})
@Index('uq_members_gym_document_active', ['gymId', 'documentId'], {
  unique: true,
  where: '"deleted_at" IS NULL AND "document_id" IS NOT NULL',
})
@Index('idx_members_gym_branch', ['gymId', 'branchId'])
@Entity('members')
export class Member extends BaseEntity {
  @Index()
  @Column({ name: 'gym_id', type: 'uuid' })
  public gymId: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  public userId: string | null;

  @Column({ name: 'role_id', type: 'uuid' })
  public roleId: string;

  @Column({ name: 'branch_id', type: 'uuid', nullable: true })
  public branchId: string | null;

  @Column({ name: 'first_name', type: 'varchar', length: 255 })
  public firstName: string;

  @Column({ name: 'last_name', type: 'varchar', length: 255 })
  public lastName: string;

  @Column({ name: 'document_id', type: 'varchar', length: 64, nullable: true })
  public documentId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  public email: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  public phone: string | null;

  @Column({ name: 'birth_date', type: 'date', nullable: true })
  public birthDate: string | null;

  @Column({ name: 'photo_url', type: 'varchar', length: 1024, nullable: true })
  public photoUrl: string | null;

  @Column({ name: 'emergency_contact_name', type: 'varchar', length: 255, nullable: true })
  public emergencyContactName: string | null;

  @Column({ name: 'emergency_contact_phone', type: 'varchar', length: 32, nullable: true })
  public emergencyContactPhone: string | null;

  @Column({ type: 'enum', enum: MemberStatus, default: MemberStatus.ACTIVE })
  public status: MemberStatus;

  @Column({ type: 'jsonb', nullable: true })
  public consents: Record<string, unknown> | null;
}
