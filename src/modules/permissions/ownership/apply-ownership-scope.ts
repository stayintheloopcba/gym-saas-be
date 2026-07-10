import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { hasGlobalAccess, hasGymAccess } from '../../../common/enums/hierarchy-level.enum';
import { OwnershipContext } from './ownership-context';

/**
 * Aplica el alcance del usuario a una query de listado, agregando la condición de
 * scope según su `HierarchyLevel`:
 * - `GLOBAL` → sin filtro adicional.
 * - `GYM` → filtra por organización.
 * - `SELF` → filtra por organización y por `createdBy`.
 *
 * `columns` permite mapear los nombres de columna reales (default: convención
 * snake_case de `BaseEntity`).
 */
export function applyOwnershipScope<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  alias: string,
  context: OwnershipContext,
  columns: { gymId?: string; createdBy?: string } = {},
): SelectQueryBuilder<T> {
  if (hasGlobalAccess(context.hierarchyLevel)) {
    return qb;
  }

  const gymColumn = columns.gymId ?? 'gym_id';
  const ownerColumn = columns.createdBy ?? 'created_by';

  qb.andWhere(`${alias}.${gymColumn} = :ownershipGymId`, { ownershipGymId: context.gymId });

  if (!hasGymAccess(context.hierarchyLevel)) {
    // SELF
    qb.andWhere(`${alias}.${ownerColumn} = :ownershipUserId`, { ownershipUserId: context.userId });
  }

  return qb;
}
