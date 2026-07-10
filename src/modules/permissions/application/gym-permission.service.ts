import { Inject, Injectable } from '@nestjs/common';
import { HierarchyLevel } from '../../../common/enums/hierarchy-level.enum';
import { PermissionDeniedError } from '../domain/permission.errors';
import { PermissionKey } from '../domain/permission-key';
import { PERMISSION_REPOSITORY } from '../domain/permission.repository';
import type { PermissionRepository } from '../domain/permission.repository';
import { RoleSummary } from '../domain/role-summary';

/** Permisos efectivos del usuario en un gym, para consumo del frontend. */
export interface EffectivePermissions {
  role: RoleSummary;
  /** Alcance de datos del usuario (SELF / GYM / GLOBAL). */
  hierarchyLevel: HierarchyLevel;
  permissions: PermissionKey[];
}

/**
 * Resuelve el permiso efectivo de un usuario en un gym: lookup directo
 * `member.roleId → role_permissions`. Sin overrides, sin deny, sin
 * precedencia (ver design Decision 5).
 */
@Injectable()
export class GymPermissionService {
  constructor(@Inject(PERMISSION_REPOSITORY) private readonly permissions: PermissionRepository) {}

  async checkPermission(
    userId: string,
    gymId: string,
    permission: PermissionKey | readonly PermissionKey[],
  ): Promise<boolean> {
    const memberRole = await this.permissions.findMemberRole(userId, gymId);
    if (!memberRole) {
      return false;
    }

    const codes = Array.isArray(permission) ? permission : [permission];
    const granted = new Set(await this.permissions.findPermissionCodes(memberRole.roleId));

    // Semántica OR: alcanza con que un código esté otorgado.
    return codes.some((code) => granted.has(code));
  }

  async requirePermission(
    userId: string,
    gymId: string,
    permission: PermissionKey | readonly PermissionKey[],
  ): Promise<void> {
    if (!(await this.checkPermission(userId, gymId, permission))) {
      throw new PermissionDeniedError();
    }
  }

  /**
   * Devuelve el contexto de permisos efectivos del usuario en el gym: su rol
   * del catálogo y todos los códigos que ese rol otorga. Si no tiene un
   * `Member` en el gym, devuelve `null`.
   */
  async getEffectivePermissions(userId: string, gymId: string): Promise<EffectivePermissions | null> {
    const memberRole = await this.permissions.findMemberRole(userId, gymId);
    if (!memberRole) {
      return null;
    }

    const permissions = await this.permissions.findPermissionCodes(memberRole.roleId);

    return {
      role: { id: memberRole.roleId, key: memberRole.roleKey, name: memberRole.roleName },
      hierarchyLevel: memberRole.hierarchyLevel,
      permissions: permissions as PermissionKey[],
    };
  }
}
