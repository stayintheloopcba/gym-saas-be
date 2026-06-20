import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../domain/permission.entity';
import { PermissionCatalogRepository } from '../domain/permission-catalog.repository';

@Injectable()
export class TypeOrmPermissionCatalogRepository implements PermissionCatalogRepository {
  constructor(@InjectRepository(Permission) private readonly repo: Repository<Permission>) {}

  listActive(): Promise<Permission[]> {
    return this.repo.find({ where: { isActive: true }, order: { code: 'ASC' } });
  }

  async existsActive(code: string): Promise<boolean> {
    return (await this.repo.count({ where: { code, isActive: true } })) > 0;
  }
}
