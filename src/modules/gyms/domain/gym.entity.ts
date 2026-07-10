import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/**
 * Agregado `Gym` (el tenant del producto multi-tenant).
 *
 * Igual que `User`, la entidad de dominio y el modelo de persistencia TypeORM
 * son la misma clase; el acceso pasa siempre por el port `GymRepository`.
 *
 * Hereda de `BaseEntity`: UUID + auditoría + soft delete (`deletedAt`).
 *
 * El `slug` es único **entre organizaciones no eliminadas**: el índice es parcial
 * (`WHERE deleted_at IS NULL`), de modo que el slug de una organización borrada
 * (soft delete) queda libre para reutilizarse.
 */
@Index('uq_gyms_slug_active', ['slug'], { unique: true, where: '"deleted_at" IS NULL' })
@Entity('gyms')
export class Gym extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  public name: string;

  /** Identificador URL-safe derivado del `name`. Único entre orgs activas. */
  @Column({ type: 'varchar', length: 255 })
  public slug: string;

  /**
   * Fin del trial cosmético (7 días desde la creación). `null` para orgs
   * anteriores a esta capacidad: el frontend simplemente no muestra el banner.
   */
  @Column({ name: 'trial_ends_at', type: 'timestamptz', nullable: true })
  public trialEndsAt: Date | null;

  /** Color primario de marca (hex `#RRGGBB`). `null` = tema por defecto. */
  @Column({ name: 'primary_color', type: 'varchar', length: 7, nullable: true })
  public primaryColor: string | null;

  /** Color secundario de marca (hex `#RRGGBB`). */
  @Column({ name: 'secondary_color', type: 'varchar', length: 7, nullable: true })
  public secondaryColor: string | null;

  /** Tipografía de marca (whitelist `GYM_FONTS`). */
  @Column({ name: 'font_family', type: 'varchar', length: 64, nullable: true })
  public fontFamily: string | null;

  /** URL del logo de la organización (almacenado en MinIO). `null` = placeholder. */
  @Column({ name: 'logo_url', type: 'varchar', length: 1024, nullable: true })
  public logoUrl: string | null;

  /** URL del banner de la organización (almacenado en MinIO). `null` = sin banner. */
  @Column({ name: 'banner_url', type: 'varchar', length: 1024, nullable: true })
  public bannerUrl: string | null;
}
