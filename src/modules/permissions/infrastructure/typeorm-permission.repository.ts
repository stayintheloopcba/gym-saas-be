import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HierarchyLevel } from '../../../common/enums/hierarchy-level.enum';
import { Membership } from '../../memberships/domain/membership.entity';
import { MembershipRoleInfo, PermissionRepository } from '../domain/permission.repository';
import { RolePermission } from '../domain/role-permission.entity';
import { Role } from '../domain/role.entity';
import { RoleSummary } from '../domain/role-summary';

@Injectable()
export class TypeOrmPermissionRepository implements PermissionRepository {
  constructor(
    @InjectRepository(Membership) private readonly memberships: Repository<Membership>,
    @InjectRepository(Role) private readonly roles: Repository<Role>,
    @InjectRepository(RolePermission) private readonly rolePermissions: Repository<RolePermission>,
  ) {}

  async findMembershipRole(userId: string, organizationId: string): Promise<MembershipRoleInfo | null> {
    const membership = await this.memberships.findOne({ where: { userId, organizationId } });
    if (!membership) {
      return null;
    }
    const role = await this.roles.findOne({ where: { id: membership.roleId } });
    if (!role) {
      return null;
    }
    return {
      roleId: role.id,
      roleKey: role.key,
      roleName: role.name,
      hierarchyLevel: role.hierarchyLevel as HierarchyLevel,
    };
  }

  async findPermissionCodes(roleId: string): Promise<string[]> {
    const rows = await this.rolePermissions.find({ where: { roleId } });
    return rows.map((row) => row.permissionCode);
  }

  async findRoleSummary(roleId: string): Promise<RoleSummary | null> {
    const role = await this.roles.findOne({ where: { id: roleId } });
    return role ? { id: role.id, key: role.key, name: role.name } : null;
  }
}
