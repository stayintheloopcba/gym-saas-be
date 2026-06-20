import { Permission } from './permission.entity';

export const PERMISSION_CATALOG_REPOSITORY = Symbol('PERMISSION_CATALOG_REPOSITORY');

/** Lectura del catálogo de permisos disponibles. */
export interface PermissionCatalogRepository {
  listActive(): Promise<Permission[]>;
  existsActive(code: string): Promise<boolean>;
}
