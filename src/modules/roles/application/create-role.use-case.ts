import { Inject, Injectable } from '@nestjs/common';
import { HierarchyLevel } from '../../../common/enums/hierarchy-level.enum';
import { Role } from '../../permissions/domain/role.entity';
import { RoleKeyConflictError } from '../domain/role.errors';
import { ROLE_REPOSITORY } from '../domain/role.repository';
import type { RoleRepository } from '../domain/role.repository';

export interface CreateRoleCommand {
  key: string;
  name: string;
  description?: string;
  hierarchyLevel: HierarchyLevel;
}

/** Platform-admin only (guardado por `PlatformAdminGuard` en el controller). */
@Injectable()
export class CreateRoleUseCase {
  constructor(@Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository) {}

  async execute(command: CreateRoleCommand): Promise<Role> {
    const existing = await this.roles.findByKey(command.key);
    if (existing) {
      throw new RoleKeyConflictError(command.key);
    }

    const role = Object.assign(new Role(), {
      key: command.key,
      name: command.name,
      description: command.description,
      hierarchyLevel: command.hierarchyLevel,
    });
    return this.roles.save(role);
  }
}
