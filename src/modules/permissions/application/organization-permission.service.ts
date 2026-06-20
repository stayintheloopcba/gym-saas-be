import { Inject, Injectable } from '@nestjs/common';
import { HierarchyLevel, SYSTEM_ROLE_HIERARCHY } from '../../../common/enums/hierarchy-level.enum';
import { MembershipRole } from '../../../common/enums/membership-role.enum';
import { PermissionDeniedError } from '../domain/permission.errors';
import { ALL_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS, PermissionKey } from '../domain/permission-key';
import { GrantLevel, PermissionGrant, PERMISSION_REPOSITORY } from '../domain/permission.repository';
import type { PermissionRepository } from '../domain/permission.repository';

/** Precedencia del baseline de un rol de sistema: la mínima, cualquier override la pisa. */
const BASELINE_PRECEDENCE = 0;

/** Permisos efectivos del usuario en una organización, para consumo del frontend. */
export interface EffectivePermissions {
  role: MembershipRole;
  customRoleId: string | null;
  /** Alcance de datos del usuario (SELF / ORGANIZATION / GLOBAL). */
  hierarchyLevel: HierarchyLevel;
  permissions: PermissionKey[];
}

/**
 * Motor de evaluación RABAC. Resuelve el permiso efectivo de un usuario en una
 * organización combinando:
 * - el baseline de su rol de sistema (`DEFAULT_ROLE_PERMISSIONS`, en memoria),
 * - los grants persistidos de su rol custom (si tiene), y
 * - los grants persistidos a nivel usuario (overrides).
 *
 * Conflictos: gana el de mayor `precedence`; ante empate, el de nivel `user` gana
 * al de `role`; ante empate total, un deny (fail-safe) gana a un allow.
 */
@Injectable()
export class OrganizationPermissionService {
  constructor(@Inject(PERMISSION_REPOSITORY) private readonly permissions: PermissionRepository) {}

  async checkPermission(
    userId: string,
    organizationId: string,
    permission: PermissionKey | readonly PermissionKey[],
  ): Promise<boolean> {
    const assignment = await this.permissions.findAssignment(userId, organizationId);
    if (!assignment) {
      return false;
    }

    const codes = Array.isArray(permission) ? permission : [permission];
    const grants = await this.permissions.findGrants({
      organizationId,
      userId,
      roleId: assignment.customRoleId,
      permissionCodes: codes,
    });

    // Semántica OR: alcanza con que un código resuelva allow.
    return codes.some((code) => this.resolve(code, assignment.membershipRole, grants));
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
   * su rol de sistema, su rol custom (si tiene) y todos los códigos que resuelven
   * allow tras combinar baseline + grants. Pensado para que el frontend sepa qué
   * puede hacer el usuario actual. Si no es miembro de la org, devuelve `null`.
   */
  async getEffectivePermissions(userId: string, organizationId: string): Promise<EffectivePermissions | null> {
    const assignment = await this.permissions.findAssignment(userId, organizationId);
    if (!assignment) {
      return null;
    }

    const grants = await this.permissions.findGrants({
      organizationId,
      userId,
      roleId: assignment.customRoleId,
      permissionCodes: ALL_PERMISSIONS,
    });

    const permissions = ALL_PERMISSIONS.filter((code) => this.resolve(code, assignment.membershipRole, grants));

    let hierarchyLevel = SYSTEM_ROLE_HIERARCHY[assignment.membershipRole];
    if (assignment.customRoleId) {
      const customLevel = await this.permissions.findRoleHierarchyLevel(assignment.customRoleId);
      if (customLevel != null) {
        hierarchyLevel = customLevel;
      }
    }

    return {
      role: assignment.membershipRole,
      customRoleId: assignment.customRoleId ?? null,
      hierarchyLevel,
      permissions,
    };
  }

  /** Resuelve un único código combinando baseline + grants y eligiendo el ganador. */
  private resolve(code: string, systemRole: MembershipRole, grants: PermissionGrant[]): boolean {
    const candidates = grants.filter((grant) => grant.permissionCode === code);

    // Baseline aditivo del rol de sistema: allow implícito de precedencia mínima.
    if (DEFAULT_ROLE_PERMISSIONS[systemRole].includes(code as PermissionKey)) {
      candidates.push({ permissionCode: code, value: true, precedence: BASELINE_PRECEDENCE, level: 'role' });
    }

    if (candidates.length === 0) {
      return false;
    }

    let winner = candidates[0];
    for (let i = 1; i < candidates.length; i += 1) {
      winner = this.preferred(winner, candidates[i]);
    }
    return winner.value;
  }

  /** Elige el grant ganador entre dos: precedencia, luego nivel usuario, luego deny. */
  private preferred(a: PermissionGrant, b: PermissionGrant): PermissionGrant {
    if (a.precedence !== b.precedence) {
      return a.precedence > b.precedence ? a : b;
    }
    if (a.level !== b.level) {
      return this.levelWins(a.level) ? a : b;
    }
    if (a.value !== b.value) {
      // Empate total: el deny (value=false) gana al allow (fail-safe).
      return a.value ? b : a;
    }
    return a;
  }

  private levelWins(level: GrantLevel): boolean {
    return level === 'user';
  }
}
