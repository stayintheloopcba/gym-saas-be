import { EntityManager } from 'typeorm';
import { Membership } from './membership.entity';

/**
 * Token de inyección para el port `MembershipRepository`.
 *
 * La infraestructura lo vincula a `TypeOrmMembershipRepository`; la capa de
 * aplicación inyecta el port por este token, nunca el `Repository<Membership>`.
 */
export const MEMBERSHIP_REPOSITORY = Symbol('MEMBERSHIP_REPOSITORY');

/**
 * Port de persistencia del agregado `Membership`.
 *
 * Todas las búsquedas excluyen registros soft-deleted. `save` acepta un
 * `EntityManager` opcional para participar en una transacción (p. ej. la creación
 * atómica de org + membresía OWNER) sin acoplar la aplicación a TypeORM.
 */
export interface MembershipRepository {
  findByUserAndOrg(userId: string, organizationId: string): Promise<Membership | null>;
  findByUser(userId: string): Promise<Membership[]>;
  findByOrg(organizationId: string): Promise<Membership[]>;
  /** Cantidad de membresías OWNER activas de una organización. */
  countOwners(organizationId: string): Promise<number>;
  /** Cantidad de membresías activas que usan un rol custom dado (para "rol en uso"). */
  countByRole(roleId: string): Promise<number>;
  save(membership: Membership, manager?: EntityManager): Promise<Membership>;
  softDelete(id: string): Promise<void>;
}
