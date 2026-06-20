import { Organization } from '../domain/organization.entity';

/**
 * Token de inyección para el port transaccional de creación de organizaciones.
 */
export const ORG_UNIT_OF_WORK = Symbol('ORG_UNIT_OF_WORK');

/**
 * Unit-of-work que persiste una organización y su membresía `OWNER` en una sola
 * transacción (ver Decision 5 del design: una org sin owner es un estado inválido).
 *
 * Vive como port para que `CreateOrganizationUseCase` siga siendo agnóstico de
 * TypeORM: la derivación del slug y las validaciones quedan en la aplicación; solo
 * el commit atómico se delega a la infraestructura (`DataSource.transaction`).
 */
export interface OrgUnitOfWork {
  /**
   * Persiste `organization` y crea su membresía `OWNER` para `ownerUserId`
   * atómicamente. Devuelve la organización persistida.
   */
  createOrganizationWithOwner(organization: Organization, ownerUserId: string): Promise<Organization>;
}
