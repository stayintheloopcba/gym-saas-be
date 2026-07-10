import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/**
 * Agregado `Discipline`: catálogo global fijo (sin `gymId`), sembrado al
 * bootstrap. Los gyms no crean disciplinas: eligen de este catálogo vía
 * `BRANCH_DISCIPLINES`.
 */
@Index('uq_disciplines_code_active', ['code'], { unique: true, where: '"deleted_at" IS NULL' })
@Entity('disciplines')
export class Discipline extends BaseEntity {
  /** Identificador estable (p. ej. `CROSSFIT`). Único global. */
  @Column({ type: 'varchar', length: 64 })
  public code: string;

  @Column({ type: 'varchar', length: 255 })
  public name: string;

  @Column({ type: 'boolean', default: true })
  public active: boolean;
}
