import { Inject, Injectable } from '@nestjs/common';
import { Role } from '../domain/role.entity';
import { Permission } from '../domain/permission.entity';
import { PERMISSIONS, DEFAULT_ROLE_PERMISSIONS, PermissionKey } from '../domain/permission-key';
import { PermissionDeniedError } from '../domain/permission.errors';
import { PERMISSION_ASSIGNMENT_REPOSITORY } from '../domain/permission-assignment.repository';
import type { PermissionAssignmentRepository } from '../domain/permission-assignment.repository';
import { PERMISSION_CATALOG_REPOSITORY } from '../domain/permission-catalog.repository';
import type { PermissionCatalogRepository } from '../domain/permission-catalog.repository';
import { OrganizationPermissionService } from './organization-permission.service';

export interface MatrixRoleAssignment {
  permissionCode: string;
  value: boolean;
}

export interface PermissionMatrix {
  roles: Role[];
  permissions: Permission[];
  /** Por id de rol: sus permisos asignados (con su `value`). */
  assignments: Record<string, MatrixRoleAssignment[]>;
}

/**
 * Arma la matriz roles × permisos de la organización activa. Las asignaciones a
 * nivel rol salen de `PermissionAssignment`; el baseline de los roles de sistema
 * se deriva de `DEFAULT_ROLE_PERMISSIONS` (no se persiste por organización).
 */
@Injectable()
export class PermissionsMatrixService {
  constructor(
    @Inject(PERMISSION_ASSIGNMENT_REPOSITORY) private readonly assignments: PermissionAssignmentRepository,
    @Inject(PERMISSION_CATALOG_REPOSITORY) private readonly catalog: PermissionCatalogRepository,
    private readonly permissions: OrganizationPermissionService,
  ) {}

  async listCatalog(callerUserId: string, organizationId: string): Promise<Permission[]> {
    await this.requireRead(callerUserId, organizationId);
    return this.catalog.listActive();
  }

  async getMatrix(
    callerUserId: string,
    organizationId: string,
    roles: Role[],
    resource?: string,
  ): Promise<PermissionMatrix> {
    await this.requireRead(callerUserId, organizationId);

    const permissions = (await this.catalog.listActive()).filter((permission) =>
      resource ? permission.code.startsWith(`${resource}:`) : true,
    );
    const allowedCodes = new Set(permissions.map((permission) => permission.code));

    const roleRows = await this.assignments.listRoleAssignments(organizationId);
    const assignments: Record<string, MatrixRoleAssignment[]> = {};

    for (const role of roles) {
      if (role.isSystem && role.systemKey) {
        // Baseline en memoria de los roles de sistema.
        assignments[role.id] = DEFAULT_ROLE_PERMISSIONS[role.systemKey]
          .filter((code) => allowedCodes.has(code))
          .map((code: PermissionKey) => ({ permissionCode: code, value: true }));
      } else {
        assignments[role.id] = roleRows
          .filter((row) => row.roleId === role.id && allowedCodes.has(row.permissionCode))
          .map((row) => ({ permissionCode: row.permissionCode, value: row.value }));
      }
    }

    return { roles, permissions, assignments };
  }

  private async requireRead(callerUserId: string, organizationId: string): Promise<void> {
    const allowed = await this.permissions.checkPermission(callerUserId, organizationId, [
      PERMISSIONS.PERMISSIONS_MANAGE,
      PERMISSIONS.ROLES_READ,
    ]);
    if (!allowed) {
      throw new PermissionDeniedError();
    }
  }
}
