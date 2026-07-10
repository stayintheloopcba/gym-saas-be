import { HierarchyLevel } from '../../../common/enums/hierarchy-level.enum';
import { RoleSummary } from './role-summary';

export const PERMISSION_REPOSITORY = Symbol('PERMISSION_REPOSITORY');

/** El rol del catálogo asignado al `Member` del usuario en el gym. */
export interface MemberRoleInfo {
  roleId: string;
  roleKey: string;
  roleName: string;
  hierarchyLevel: HierarchyLevel;
}

/**
 * Port de lectura para la evaluación de permisos: resuelve el rol de un
 * `Member` y los códigos de permiso que ese rol otorga (`role_permissions`).
 * Lookup directo, sin overrides ni precedencia.
 */
export interface PermissionRepository {
  /** Rol del catálogo del `Member` del usuario en el gym, o `null` si no es miembro. */
  findMemberRole(userId: string, gymId: string): Promise<MemberRoleInfo | null>;
  /** Códigos de permiso otorgados a un rol. */
  findPermissionCodes(roleId: string): Promise<string[]>;
  /** Forma resumida de un rol del catálogo, o `null` si no existe. */
  findRoleSummary(roleId: string): Promise<RoleSummary | null>;
}
