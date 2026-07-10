import { HierarchyLevel } from '../../../common/enums/hierarchy-level.enum';

/**
 * Contexto de ownership de un usuario en una organización: su `HierarchyLevel`
 * efectivo determina el alcance (SELF/GYM/GLOBAL) de sus permisos sobre
 * los recursos.
 */
export interface OwnershipContext {
  userId: string;
  gymId: string;
  hierarchyLevel: HierarchyLevel;
}
