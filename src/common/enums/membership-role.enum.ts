/**
 * Rol de un usuario dentro de una organización.
 *
 * En esta fase la autorización es gruesa (se compara contra esta jerarquía).
 * Los permisos granulares (`Role` / `Permission` / `RolePermission`) llegan en
 * la Fase 4 sin tener que reescribir la membresía.
 */
export enum MembershipRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

/**
 * Rango de gestión de cada rol de sistema (mayor = más privilegio de gestión).
 * Ordena roles para el *gating*: un llamador no puede actuar sobre un rol de
 * rango superior al suyo ni asignar uno por encima del propio.
 *
 * OJO: es distinto de `HierarchyLevel` (alcance de datos). No unificar: un VIEWER
 * tiene rango mínimo pero alcance `ORGANIZATION`. Ver `SYSTEM_ROLE_HIERARCHY`.
 */
export const MEMBERSHIP_ROLE_RANK: Record<MembershipRole, number> = {
  [MembershipRole.OWNER]: 10,
  [MembershipRole.ADMIN]: 5,
  [MembershipRole.MEMBER]: 2,
  [MembershipRole.VIEWER]: 1,
};
