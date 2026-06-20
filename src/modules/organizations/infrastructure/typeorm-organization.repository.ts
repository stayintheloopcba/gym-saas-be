import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../domain/organization.entity';
import { OrganizationRepository } from '../domain/organization.repository';

/**
 * Implementación TypeORM del port `OrganizationRepository`.
 *
 * `findOne` respeta `@DeleteDateColumn`, por lo que `findBySlug` solo encuentra
 * slugs de organizaciones activas (clave para reutilizar el slug de una borrada).
 */
@Injectable()
export class TypeOrmOrganizationRepository implements OrganizationRepository {
  constructor(@InjectRepository(Organization) private readonly repo: Repository<Organization>) {}

  findById(id: string): Promise<Organization | null> {
    return this.repo.findOne({ where: { id } });
  }

  findBySlug(slug: string): Promise<Organization | null> {
    return this.repo.findOne({ where: { slug } });
  }

  save(organization: Organization): Promise<Organization> {
    return this.repo.save(organization);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
