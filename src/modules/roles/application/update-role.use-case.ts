import { Inject, Injectable } from '@nestjs/common';
import { HierarchyLevel } from '../../../common/enums/hierarchy-level.enum';
import { Role } from '../../permissions/domain/role.entity';
import { RoleNotFoundError } from '../domain/role.errors';
import { ROLE_REPOSITORY } from '../domain/role.repository';
import type { RoleRepository } from '../domain/role.repository';

export interface UpdateRoleCommand {
  roleId: string;
  name?: string;
  description?: string;
  hierarchyLevel?: HierarchyLevel;
}

/** Platform-admin only. `key` es inmutable: el DTO ni siquiera lo acepta. */
@Injectable()
export class UpdateRoleUseCase {
  constructor(@Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository) {}

  async execute(command: UpdateRoleCommand): Promise<Role> {
    const role = await this.roles.findById(command.roleId);
    if (!role) {
      throw new RoleNotFoundError(command.roleId);
    }

    if (command.name !== undefined) {
      role.name = command.name;
    }
    if (command.description !== undefined) {
      role.description = command.description;
    }
    if (command.hierarchyLevel !== undefined) {
      role.hierarchyLevel = command.hierarchyLevel;
    }

    return this.roles.save(role);
  }
}
