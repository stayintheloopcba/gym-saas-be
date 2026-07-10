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
 * El branding (colores, tipografía, logo, banner) y los campos operativos
 * viven en `GymSettings` (1:1, Decision #4 técnica); `Gym` es un tenant row
 * liviano con solo `name`/`slug`/`trialEndsAt`.
 *
 * El `slug` es único **entre gyms no eliminados**: el índice es parcial
 * (`WHERE deleted_at IS NULL`), de modo que el slug de un gym borrado
 * (soft delete) queda libre para reutilizarse.
 */
@Index('uq_gyms_slug_active', ['slug'], { unique: true, where: '"deleted_at" IS NULL' })
@Entity('gyms')
export class Gym extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  public name: string;

  /** Identificador URL-safe derivado del `name`. Único entre gyms activos. */
  @Column({ type: 'varchar', length: 255 })
  public slug: string;

  /**
   * Fin del trial cosmético (7 días desde la creación). `null` para gyms
   * anteriores a esta capacidad: el frontend simplemente no muestra el banner.
   */
  @Column({ name: 'trial_ends_at', type: 'timestamptz', nullable: true })
  public trialEndsAt: Date | null;
}
