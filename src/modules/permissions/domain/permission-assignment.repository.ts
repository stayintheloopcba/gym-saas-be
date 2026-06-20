export const PERMISSION_ASSIGNMENT_REPOSITORY = Symbol('PERMISSION_ASSIGNMENT_REPOSITORY');

/** Sujeto de una asignación: rol XOR usuario, siempre dentro de una organización. */
export interface AssignmentSubject {
  organizationId: string;
  userId?: string;
  roleId?: string;
}

/** Asignación a nivel rol, usada para construir la matriz. */
export interface RoleAssignmentRow {
  roleId: string;
  permissionCode: string;
  value: boolean;
}

export interface PermissionAssignmentRepository {
  /** Crea o actualiza (allow/deny + precedencia) la asignación del sujeto para un código. */
  upsert(subject: AssignmentSubject, permissionCode: string, value: boolean, precedence: number): Promise<void>;
  /** Elimina (soft delete) la asignación del sujeto para un código, si existe. */
  remove(subject: AssignmentSubject, permissionCode: string): Promise<void>;
  /** Asignaciones a nivel rol de una organización (para la matriz). */
  listRoleAssignments(organizationId: string): Promise<RoleAssignmentRow[]>;
}
