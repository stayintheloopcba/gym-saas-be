export const ROLE_PERMISSION_REPOSITORY = Symbol('ROLE_PERMISSION_REPOSITORY');

/**
 * Port de escritura del catálogo `role_permissions`, usado por la
 * administración de roles (`/admin/roles/:roleId/permissions`).
 */
export interface RolePermissionRepository {
  findCodesByRoleId(roleId: string): Promise<string[]>;
  /** Reemplaza el set completo de permisos de un rol por `permissionCodes`. */
  replacePermissions(roleId: string, permissionCodes: readonly string[]): Promise<void>;
}
