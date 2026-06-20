import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HierarchyLevel } from '../../../common/enums/hierarchy-level.enum';
import { Membership } from '../../memberships/domain/membership.entity';
import { PermissionAssignment as PermissionAssignmentEntity } from '../domain/permission-assignment.entity';
import { Role } from '../domain/role.entity';
import {
  FindGrantsQuery,
  PermissionAssignment,
  PermissionGrant,
  PermissionRepository,
} from '../domain/permission.repository';

@Injectable()
export class TypeOrmPermissionRepository implements PermissionRepository {
  constructor(
    @InjectRepository(Membership) private readonly memberships: Repository<Membership>,
    @InjectRepository(PermissionAssignmentEntity)
    private readonly assignments: Repository<PermissionAssignmentEntity>,
    @InjectRepository(Role) private readonly roles: Repository<Role>,
  ) {}

  async findAssignment(userId: string, organizationId: string): Promise<PermissionAssignment | null> {
    const membership = await this.memberships.findOne({ where: { userId, organizationId } });
    if (!membership) {
      return null;
    }
    return {
      membershipRole: membership.role,
      customRoleId: membership.roleId ?? undefined,
    };
  }

  async findGrants(query: FindGrantsQuery): Promise<PermissionGrant[]> {
    const { organizationId, userId, roleId, permissionCodes } = query;
    if (permissionCodes.length === 0) {
      return [];
    }

    const qb = this.assignments
      .createQueryBuilder('assignment')
      .innerJoin('permissions', 'permission', 'permission.code = assignment.permission_code')
      .where('assignment.organization_id = :organizationId', { organizationId })
      .andWhere('assignment.permission_code IN (:...permissionCodes)', { permissionCodes: [...permissionCodes] })
      .andWhere('assignment.deleted_at IS NULL')
      .andWhere('permission.is_active = true');

    // Sujetos aplicables: el usuario, y su rol custom si lo tiene.
    if (roleId) {
      qb.andWhere('(assignment.user_id = :userId OR assignment.role_id = :roleId)', { userId, roleId });
    } else {
      qb.andWhere('assignment.user_id = :userId', { userId });
    }

    const rows = await qb.getMany();
    return rows.map((row) => ({
      permissionCode: row.permissionCode,
      value: row.value,
      precedence: row.precedence,
      level: row.userId ? 'user' : 'role',
    }));
  }

  async findRoleHierarchyLevel(roleId: string): Promise<HierarchyLevel | null> {
    const role = await this.roles.findOne({ where: { id: roleId } });
    return role ? (role.hierarchyLevel as HierarchyLevel) : null;
  }
}
