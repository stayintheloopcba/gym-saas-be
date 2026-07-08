/**
 * Alcance de datos de un usuario sobre los recursos de una organización.
 *
 * Vive en el `hierarchyLevel` del rol del catálogo asignado a la membresía.
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
