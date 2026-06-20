import { BeforeInsert, BeforeUpdate, Column, DeleteDateColumn, Index, UpdateDateColumn } from 'typeorm';
import { DefaultBy } from '../enums/default-by.enum';
import { authContextStorage } from '../context/auth-context.store';

/**
 * Campos de auditoría comunes a todas las entidades persistidas.
 *
 * `createdBy` / `updatedBy` se completan automáticamente desde el contexto de
 * autenticación del request (ver `auth-context.store`). Si no hay contexto
 * (procesos del sistema, jobs) cae en `DefaultBy.UNKNOWN`.
 */
export abstract class BaseAuditEntity {
  @Index()
  @Column({ name: 'created_at', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  public createdAt: Date;

  @Index()
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone', nullable: true })
  public updatedAt?: Date;

  /**
   * Soft delete: `null` = registro activo.
   * TypeORM excluye por defecto los registros con `deletedAt` no nulo y
   * `repo.softDelete()` / `repo.softRemove()` setean esta columna en vez de
   * borrar la fila físicamente.
   */
  @Index()
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp with time zone', nullable: true })
  public deletedAt?: Date;

  @Index()
  @Column({ name: 'created_by', nullable: true })
  public createdBy: string;

  @Index()
  @Column({ name: 'updated_by', nullable: true })
  public updatedBy?: string;

  @BeforeInsert()
  protected beforeInsert(): void {
    if (this.createdBy == null || this.createdBy === '') {
      this.createdBy = this.getBy();
    }
    this.createdAt = new Date();
  }

  @BeforeUpdate()
  protected beforeUpdate(): void {
    this.updatedBy = this.getBy();
  }

  private getBy(): string {
    return authContextStorage.getStore()?.accountId ?? DefaultBy.UNKNOWN;
  }
}
