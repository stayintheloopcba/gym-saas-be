import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { AuthProvider } from '../../../common/enums/auth-provider.enum';

/**
 * Agregado `User`.
 *
 * Por decisión del design (primer módulo de referencia DDD) la entidad de
 * dominio y el modelo de persistencia TypeORM son la misma clase. El acceso
 * sigue pasando siempre por el port `UserRepository`, de modo que la capa de
 * aplicación nunca depende de TypeORM directamente.
 *
 * Hereda de `BaseEntity`: UUID + auditoría (`createdBy`/`updatedBy`) + soft
 * delete (`deletedAt`).
 */
@Entity('users')
export class User extends BaseEntity {
  /** Email normalizado (lowercase + trim). Único entre usuarios no eliminados. */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 320 })
  public email: string;

  @Column({ type: 'varchar', length: 255 })
  public name: string;

  /** Hash bcrypt. `null` para usuarios que solo entran por Google. */
  @Column({ name: 'password_hash', type: 'varchar', length: 255, nullable: true })
  public passwordHash: string | null;

  /** Identificador de Google. `null` para usuarios LOCAL que nunca vincularon Google. */
  @Index()
  @Column({ name: 'google_id', type: 'varchar', length: 255, nullable: true })
  public googleId: string | null;

  @Column({ type: 'enum', enum: AuthProvider, default: AuthProvider.LOCAL })
  public provider: AuthProvider;

  /** URL del avatar del usuario (almacenado en MinIO, Fase B). `null` = iniciales. */
  @Column({ name: 'avatar_url', type: 'varchar', length: 1024, nullable: true })
  public avatarUrl: string | null;

  /** SUPER_ADMIN: acceso a `/admin/*`, desacoplado de memberships/organizaciones. */
  @Column({ name: 'is_platform_admin', type: 'boolean', default: false })
  public isPlatformAdmin: boolean;
}
