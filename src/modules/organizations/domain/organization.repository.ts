import { Organization } from './organization.entity';

/**
 * Token de inyección para el port `OrganizationRepository`.
 *
 * La infraestructura lo vincula a `TypeOrmOrganizationRepository`; la capa de
 * aplicación inyecta el port por este token, nunca el `Repository<Organization>`.
 */
export const ORGANIZATION_REPOSITORY = Symbol('ORGANIZATION_REPOSITORY');

/**
 * Port de persistencia del agregado `Organization`.
 *
 * Todas las búsquedas excluyen registros soft-deleted (TypeORM respeta
 * `@DeleteDateColumn`), por lo que `findBySlug` solo ve slugs de orgs activas.
 */
export interface OrganizationRepository {
  findById(id: string): Promise<Organization | null>;
  findBySlug(slug: string): Promise<Organization | null>;
  save(organization: Organization): Promise<Organization>;
  softDelete(id: string): Promise<void>;
}
