import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolePermission } from '../domain/role-permission.entity';
import { RolePermissionRepository } from '../domain/role-permission.repository';

@Injectable()
export class TypeOrmRolePermissionRepository implements RolePermissionRepository {
  constructor(@InjectRepository(RolePermission) private readonly repo: Repository<RolePermission>) {}

  async findCodesByRoleId(roleId: string): Promise<string[]> {
    const rows = await this.repo.find({ where: { roleId } });
    return rows.map((row) => row.permissionCode);
  }

  async replacePermissions(roleId: string, permissionCodes: readonly string[]): Promise<void> {
    await this.repo.manager.transaction(async (manager) => {
      const repo = manager.getRepository(RolePermission);
      await repo.softDelete({ roleId });
      if (permissionCodes.length > 0) {
        await repo.save(permissionCodes.map((code) => repo.create({ roleId, permissionCode: code })));
      }
    });
  }
}
