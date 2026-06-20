import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Role } from '../../permissions/domain/role.entity';
import { RoleRepository } from '../domain/role.repository';

@Injectable()
export class TypeOrmRoleRepository implements RoleRepository {
  constructor(@InjectRepository(Role) private readonly repo: Repository<Role>) {}

  findById(id: string): Promise<Role | null> {
    return this.repo.findOne({ where: { id } });
  }

  findActiveByName(organizationId: string, name: string): Promise<Role | null> {
    return this.repo.findOne({ where: { organizationId, name } });
  }

  listForOrganization(organizationId: string): Promise<Role[]> {
    return this.repo.find({
      where: [{ organizationId: IsNull() }, { organizationId }],
      order: { hierarchyLevel: 'DESC', name: 'ASC' },
    });
  }

  save(role: Role): Promise<Role> {
    return this.repo.save(role);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
