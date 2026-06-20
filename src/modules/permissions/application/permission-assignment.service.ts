import { Inject, Injectable } from '@nestjs/common';
import { PERMISSIONS } from '../domain/permission-key';
import { UnknownPermissionError } from '../domain/permission.errors';
import { PERMISSION_ASSIGNMENT_REPOSITORY } from '../domain/permission-assignment.repository';
import type { PermissionAssignmentRepository } from '../domain/permission-assignment.repository';
import { PERMISSION_CATALOG_REPOSITORY } from '../domain/permission-catalog.repository';
import type { PermissionCatalogRepository } from '../domain/permission-catalog.repository';
import { OrganizationPermissionService } from './organization-permission.service';

/** Precedencia por convención: un override de usuario pisa al de rol. */
const ROLE_PRECEDENCE = 5;
const USER_PRECEDENCE = 10;

export interface PermissionGrantInput {
  permissionCode: string;
  value: boolean;
}

/**
 * Administración de asignaciones de permisos a roles y a usuarios. Exige el
 * permiso `permissions:manage` y valida que cada `permissionCode` exista en el
 * catálogo antes de persistir sobre `PermissionAssignment`.
 */
@Injectable()
export class PermissionAssignmentService {
  constructor(
    @Inject(PERMISSION_ASSIGNMENT_REPOSITORY) private readonly assignments: PermissionAssignmentRepository,
    @Inject(PERMISSION_CATALOG_REPOSITORY) private readonly catalog: PermissionCatalogRepository,
    private readonly permissions: OrganizationPermissionService,
  ) {}

  async assignToRole(
    callerUserId: string,
    organizationId: string,
    roleId: string,
    grant: PermissionGrantInput,
  ): Promise<void> {
    await this.authorize(callerUserId, organizationId);
    await this.assertValidPermission(grant.permissionCode);
    await this.assignments.upsert({ organizationId, roleId }, grant.permissionCode, grant.value, ROLE_PRECEDENCE);
  }

  async bulkAssignToRole(
    callerUserId: string,
    organizationId: string,
    roleId: string,
    grants: PermissionGrantInput[],
  ): Promise<void> {
    await this.authorize(callerUserId, organizationId);
    for (const grant of grants) {
      await this.assertValidPermission(grant.permissionCode);
    }
    for (const grant of grants) {
      await this.assignments.upsert({ organizationId, roleId }, grant.permissionCode, grant.value, ROLE_PRECEDENCE);
    }
  }

  async assignToUser(
    callerUserId: string,
    organizationId: string,
    userId: string,
    grant: PermissionGrantInput,
  ): Promise<void> {
    await this.authorize(callerUserId, organizationId);
    await this.assertValidPermission(grant.permissionCode);
    await this.assignments.upsert({ organizationId, userId }, grant.permissionCode, grant.value, USER_PRECEDENCE);
  }

  async unassignFromRole(
    callerUserId: string,
    organizationId: string,
    roleId: string,
    permissionCode: string,
  ): Promise<void> {
    await this.authorize(callerUserId, organizationId);
    await this.assignments.remove({ organizationId, roleId }, permissionCode);
  }

  async unassignFromUser(
    callerUserId: string,
    organizationId: string,
    userId: string,
    permissionCode: string,
  ): Promise<void> {
    await this.authorize(callerUserId, organizationId);
    await this.assignments.remove({ organizationId, userId }, permissionCode);
  }

  private authorize(callerUserId: string, organizationId: string): Promise<void> {
    return this.permissions.requirePermission(callerUserId, organizationId, PERMISSIONS.PERMISSIONS_MANAGE);
  }

  private async assertValidPermission(code: string): Promise<void> {
    if (!(await this.catalog.existsActive(code))) {
      throw new UnknownPermissionError(code);
    }
  }
}
