import { MembershipRole } from './membership-role.enum';

/**
 * Alcance de datos de un usuario sobre los recursos de una organización.
 *
 * Es un concepto SEPARADO de `MEMBERSHIP_ROLE_RANK` (que ordena roles para el
 * gating de gestión): acá importa *qué registros* ve/edita, no quién manda sobre
 * quién. Por eso un VIEWER puede tener alcance `ORGANIZATION` (lectura a nivel
 * organización) aunque sea el rol de menor rango.
 *
 * Mayor número = mayor alcance.
 */
export enum HierarchyLevel {
  /** Solo los registros propios (`createdBy === userId`). */
  SELF = 1,
  /** Todos los registros de la organización activa. */
  ORGANIZATION = 5,
  /** Todos los registros, cruzando organizaciones. Reservado para `platform_admin`. */
  GLOBAL = 10,
}

/** `true` si el nivel alcanza (o supera) el acceso a nivel organización. */
export function hasOrganizationAccess(level: HierarchyLevel): boolean {
  return level >= HierarchyLevel.ORGANIZATION;
}

/** `true` si el nivel alcanza el acceso global (cross-org). */
export function hasGlobalAccess(level: HierarchyLevel): boolean {
  return level >= HierarchyLevel.GLOBAL;
}

/**
 * Alcance de datos por rol de sistema. `GLOBAL` se reserva para el futuro
 * `platform_admin`, por eso OWNER queda en `ORGANIZATION` (multi-tenant seguro).
 * MEMBER escribe lo propio (`SELF`); VIEWER lee a nivel organización.
 */
export const SYSTEM_ROLE_HIERARCHY: Record<MembershipRole, HierarchyLevel> = {
  [MembershipRole.OWNER]: HierarchyLevel.ORGANIZATION,
  [MembershipRole.ADMIN]: HierarchyLevel.ORGANIZATION,
  [MembershipRole.MEMBER]: HierarchyLevel.SELF,
  [MembershipRole.VIEWER]: HierarchyLevel.ORGANIZATION,
};
