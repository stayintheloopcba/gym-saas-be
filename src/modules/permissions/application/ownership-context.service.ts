import { Inject, Injectable } from '@nestjs/common';
import { PERMISSION_REPOSITORY } from '../domain/permission.repository';
import type { PermissionRepository } from '../domain/permission.repository';
import { OwnershipContext } from '../ownership/ownership-context';

/**
 * Construye el `OwnershipContext` de un usuario en un gym. El nivel de
 * jerarquía sale directamente del rol del catálogo asignado a su `Member`.
 */
@Injectable()
export class OwnershipContextService {
  constructor(@Inject(PERMISSION_REPOSITORY) private readonly permissions: PermissionRepository) {}

  async build(userId: string, gymId: string): Promise<OwnershipContext | null> {
    const memberRole = await this.permissions.findMemberRole(userId, gymId);
    if (!memberRole) {
      return null;
    }

    return { userId, gymId, hierarchyLevel: memberRole.hierarchyLevel };
  }
}
