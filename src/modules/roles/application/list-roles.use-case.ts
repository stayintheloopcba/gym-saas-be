import { Inject, Injectable } from '@nestjs/common';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { Role } from '../../permissions/domain/role.entity';
import { ROLE_REPOSITORY } from '../domain/role.repository';
import type { RoleRepository } from '../domain/role.repository';

/** Listado org-scoped, de solo lectura: el catálogo es global e idéntico para todas las organizaciones. */
@Injectable()
export class ListRolesUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
    private readonly permissions: GymPermissionService,
  ) {}

  async execute(callerUserId: string, gymId: string): Promise<Role[]> {
    await this.permissions.requirePermission(callerUserId, gymId, PERMISSIONS.ROLES_READ);
    return this.roles.listAll();
  }
}
