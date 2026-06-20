import { HierarchyLevel } from '../../../common/enums/hierarchy-level.enum';
import { MembershipRole } from '../../../common/enums/membership-role.enum';

export const PERMISSION_REPOSITORY = Symbol('PERMISSION_REPOSITORY');

/** Membresía del usuario en la organización: rol de sistema + rol custom opcional. */
export interface PermissionAssignment {
  membershipRole: MembershipRole;
  customRoleId?: string;
}

/** Origen de un grant aplicable, usado por el motor para resolver precedencia. */
export type GrantLevel = 'user' | 'role';

/** Un grant aplicable a la evaluación: valor (allow/deny), precedencia y origen. */
export interface PermissionGrant {
  permissionCode: string;
  value: boolean;
  precedence: number;
  level: GrantLevel;
}

export interface FindGrantsQuery {
  organizationId: string;
  userId: string;
  /** Rol custom de la membresía, si lo tiene. */
  roleId?: string;
  permissionCodes: readonly string[];
}

export interface PermissionRepository {
  /** Devuelve el rol de sistema (baseline) y el rol custom del usuario en la org. */
  findAssignment(userId: string, organizationId: string): Promise<PermissionAssignment | null>;

  /**
   * Devuelve las asignaciones persistidas aplicables al usuario en la organización
   * para los códigos pedidos: grants a nivel usuario (`userId`) y, si tiene rol
   * custom, los de ese rol (`roleId`). Excluye soft-deleted. NO incluye el baseline
   * de roles de sistema (lo agrega el motor desde `DEFAULT_ROLE_PERMISSIONS`).
   */
  findGrants(query: FindGrantsQuery): Promise<PermissionGrant[]>;

  /** `hierarchyLevel` de un rol custom, o `null` si no existe. */
  findRoleHierarchyLevel(roleId: string): Promise<HierarchyLevel | null>;
}
