import { Inject, Injectable } from '@nestjs/common';
import { HierarchyLevel } from '../../../common/enums/hierarchy-level.enum';
import { PermissionDeniedError } from '../domain/permission.errors';
import { PermissionKey } from '../domain/permission-key';
import { PERMISSION_REPOSITORY } from '../domain/permission.repository';
import type { PermissionRepository } from '../domain/permission.repository';
import { RoleSummary } from '../domain/role-summary';

/** Permisos efectivos del usuario en una organización, para consumo del frontend. */
export interface EffectivePermissions {
  role: RoleSummary;
  /** Alcance de datos del usuario (SELF / ORGANIZATION / GLOBAL). */
  hierarchyLevel: HierarchyLevel;
  permissions: PermissionKey[];
}

/**
 * Resuelve el permiso efectivo de un usuario en una organización: lookup
 * directo `membership.roleId → role_permissions`. Sin overrides, sin deny,
 * sin precedencia (ver design Decision 5).
 */
@Injectable()
export class OrganizationPermissionService {
  constructor(@Inject(PERMISSION_REPOSITORY) private readonly permissions: PermissionRepository) {}

  async checkPermission(
    userId: string,
    organizationId: string,
    permission: PermissionKey | readonly PermissionKey[],
  ): Promise<boolean> {
    const membershipRole = await this.permissions.findMembershipRole(userId, organizationId);
    if (!membershipRole) {
      return false;
    }

    const codes = Array.isArray(permission) ? permission : [permission];
    const granted = new Set(await this.permissions.findPermissionCodes(membershipRole.roleId));

    // Semántica OR: alcanza con que un código esté otorgado.
    return codes.some((code) => granted.has(code));
  }

  async requirePermission(
    userId: string,
    organizationId: string,
    permission: PermissionKey | readonly PermissionKey[],
  ): Promise<void> {
    if (!(await this.checkPermission(userId, organizationId, permission))) {
      throw new PermissionDeniedError();
    }
  }

  /**
   * Devuelve el contexto de permisos efectivos del usuario en la organización:
   * su rol del catálogo y todos los códigos que ese rol otorga. Si no es
   * miembro de la org, devuelve `null`.
   */
  async getEffectivePermissions(userId: string, organizationId: string): Promise<EffectivePermissions | null> {
    const membershipRole = await this.permissions.findMembershipRole(userId, organizationId);
    if (!membershipRole) {
      return null;
    }

    const permissions = await this.permissions.findPermissionCodes(membershipRole.roleId);

    return {
      role: { id: membershipRole.roleId, key: membershipRole.roleKey, name: membershipRole.roleName },
      hierarchyLevel: membershipRole.hierarchyLevel,
      permissions: permissions as PermissionKey[],
    };
  }
}
