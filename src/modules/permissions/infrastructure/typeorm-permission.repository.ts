import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HierarchyLevel } from '../../../common/enums/hierarchy-level.enum';
import { Member } from '../../members/domain/member.entity';
import { MemberRoleInfo, PermissionRepository } from '../domain/permission.repository';
import { RolePermission } from '../domain/role-permission.entity';
import { Role } from '../domain/role.entity';
import { RoleSummary } from '../domain/role-summary';

@Injectable()
export class TypeOrmPermissionRepository implements PermissionRepository {
  constructor(
    @InjectRepository(Member) private readonly members: Repository<Member>,
    @InjectRepository(Role) private readonly roles: Repository<Role>,
    @InjectRepository(RolePermission) private readonly rolePermissions: Repository<RolePermission>,
  ) {}

  async findMemberRole(userId: string, gymId: string): Promise<MemberRoleInfo | null> {
    const member = await this.members.findOne({ where: { userId, gymId } });
    if (!member) {
      return null;
    }
    const role = await this.roles.findOne({ where: { id: member.roleId } });
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
