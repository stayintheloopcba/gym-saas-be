import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { PermissionAssignment } from '../domain/permission-assignment.entity';
import {
  AssignmentSubject,
  PermissionAssignmentRepository,
  RoleAssignmentRow,
} from '../domain/permission-assignment.repository';

@Injectable()
export class TypeOrmPermissionAssignmentRepository implements PermissionAssignmentRepository {
  constructor(@InjectRepository(PermissionAssignment) private readonly repo: Repository<PermissionAssignment>) {}

  async upsert(subject: AssignmentSubject, permissionCode: string, value: boolean, precedence: number): Promise<void> {
    const existing = await this.findActive(subject, permissionCode);
    if (existing) {
      existing.value = value;
      existing.precedence = precedence;
      await this.repo.save(existing);
      return;
    }
    await this.repo.save(
      this.repo.create({
        organizationId: subject.organizationId,
        userId: subject.userId ?? null,
        roleId: subject.roleId ?? null,
        permissionCode,
        value,
        precedence,
      }),
    );
  }

  async remove(subject: AssignmentSubject, permissionCode: string): Promise<void> {
    const existing = await this.findActive(subject, permissionCode);
    if (existing) {
      await this.repo.softDelete(existing.id);
    }
  }

  async listRoleAssignments(organizationId: string): Promise<RoleAssignmentRow[]> {
    const rows = await this.repo
      .createQueryBuilder('assignment')
      .where('assignment.organization_id = :organizationId', { organizationId })
      .andWhere('assignment.role_id IS NOT NULL')
      .getMany();

    return rows.map((row) => ({
      roleId: row.roleId as string,
      permissionCode: row.permissionCode,
      value: row.value,
    }));
  }

  private findActive(subject: AssignmentSubject, permissionCode: string): Promise<PermissionAssignment | null> {
    return this.repo.findOne({
      where: {
        organizationId: subject.organizationId,
        userId: subject.userId ?? IsNull(),
        roleId: subject.roleId ?? IsNull(),
        permissionCode,
      },
    });
  }
}
