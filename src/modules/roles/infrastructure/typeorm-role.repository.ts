import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../permissions/domain/role.entity';
import { RoleRepository } from '../domain/role.repository';

@Injectable()
export class TypeOrmRoleRepository implements RoleRepository {
  constructor(@InjectRepository(Role) private readonly repo: Repository<Role>) {}

  findById(id: string): Promise<Role | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByKey(key: string): Promise<Role | null> {
    return this.repo.findOne({ where: { key } });
  }

  listAll(): Promise<Role[]> {
    return this.repo.find({ order: { hierarchyLevel: 'DESC', name: 'ASC' } });
  }

  save(role: Role): Promise<Role> {
    return this.repo.save(role);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
