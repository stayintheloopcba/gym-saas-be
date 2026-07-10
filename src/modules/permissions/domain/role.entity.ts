import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/**
 * Rol del catálogo global. Compartido por todas las organizaciones: no lleva
 * `gymId`. `key` es un slug kebab-case estable e inmutable (p. ej.
 * `owner`) que el código usa para referenciar roles conocidos sin un enum.
 */
@Index('uq_roles_key_active', ['key'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
@Entity('roles')
export class Role extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  public key: string;

  @Column({ type: 'varchar', length: 100 })
  public name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  public description?: string;

  @Column({ name: 'hierarchy_level', type: 'integer', default: 1 })
  public hierarchyLevel: number;
}
