import { PrimaryGeneratedColumn } from 'typeorm';
import { BaseAuditEntity } from './base-audit.entity';

/**
 * Entidad base: identificador UUID + campos de auditoría y soft delete.
 *
 * La heredan las entidades principales del dominio (User, Organization,
 * Membership, ...) con `extends BaseEntity`.
 */
export abstract class BaseEntity extends BaseAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;
}
