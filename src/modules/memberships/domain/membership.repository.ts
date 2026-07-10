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
 * atómica de org + membresía owner) sin acoplar la aplicación a TypeORM.
 */
export interface MembershipRepository {
  findByUserAndOrg(userId: string, gymId: string): Promise<Membership | null>;
  findByUser(userId: string): Promise<Membership[]>;
  findByOrg(gymId: string): Promise<Membership[]>;
  /** Cantidad de membresías activas de una organización que tienen un rol dado (p. ej. contar owners). */
  countByRoleInOrg(gymId: string, roleId: string): Promise<number>;
  /** Cantidad de membresías activas (en cualquier organización) que usan un rol dado (para "rol en uso"). */
  countByRole(roleId: string): Promise<number>;
  save(membership: Membership, manager?: EntityManager): Promise<Membership>;
  softDelete(id: string): Promise<void>;
}
