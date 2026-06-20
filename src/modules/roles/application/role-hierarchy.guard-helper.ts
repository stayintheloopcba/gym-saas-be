import { HierarchyLevel } from '../../../common/enums/hierarchy-level.enum';
import { OwnershipContextService } from '../../permissions/application/ownership-context.service';
import { RoleHierarchyExceededError } from '../domain/role.errors';

/**
 * Verifica que el llamador no gestione un rol por encima de su propio nivel de
 * jerarquía. Compartido por los use cases de creación/edición de roles.
 */
export async function assertWithinCallerHierarchy(
  ownership: OwnershipContextService,
  callerUserId: string,
  organizationId: string,
  targetLevel: HierarchyLevel,
): Promise<void> {
  const context = await ownership.build(callerUserId, organizationId);
  if (!context || targetLevel > context.hierarchyLevel) {
    throw new RoleHierarchyExceededError();
  }
}
