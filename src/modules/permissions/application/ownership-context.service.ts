import { Inject, Injectable } from '@nestjs/common';
import { SYSTEM_ROLE_HIERARCHY } from '../../../common/enums/hierarchy-level.enum';
import { PERMISSION_REPOSITORY } from '../domain/permission.repository';
import type { PermissionRepository } from '../domain/permission.repository';
import { OwnershipContext } from '../ownership/ownership-context';

/**
 * Construye el `OwnershipContext` de un usuario en una organización. El nivel de
 * jerarquía sale del rol custom (si la membresía tiene uno) o, en su defecto, del
 * mapa de alcance del rol de sistema (`SYSTEM_ROLE_HIERARCHY`).
 */
@Injectable()
export class OwnershipContextService {
  constructor(@Inject(PERMISSION_REPOSITORY) private readonly permissions: PermissionRepository) {}

  async build(userId: string, organizationId: string): Promise<OwnershipContext | null> {
    const assignment = await this.permissions.findAssignment(userId, organizationId);
    if (!assignment) {
      return null;
    }

    let hierarchyLevel = SYSTEM_ROLE_HIERARCHY[assignment.membershipRole];
    if (assignment.customRoleId) {
      const customLevel = await this.permissions.findRoleHierarchyLevel(assignment.customRoleId);
      if (customLevel != null) {
        hierarchyLevel = customLevel;
      }
    }

    return { userId, organizationId, hierarchyLevel };
  }
}
