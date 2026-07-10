import { Gym } from './gym.entity';

/**
 * Token de inyección para el port `GymRepository`.
 *
 * La infraestructura lo vincula a `TypeOrmGymRepository`; la capa de
 * aplicación inyecta el port por este token, nunca el `Repository<Gym>`.
 */
export const GYM_REPOSITORY = Symbol('GYM_REPOSITORY');

/**
 * Port de persistencia del agregado `Gym`.
 *
 * Todas las búsquedas excluyen registros soft-deleted (TypeORM respeta
 * `@DeleteDateColumn`), por lo que `findBySlug` solo ve slugs de orgs activas.
 */
export interface GymRepository {
  findById(id: string): Promise<Gym | null>;
  findBySlug(slug: string): Promise<Gym | null>;
  save(gym: Gym): Promise<Gym>;
  softDelete(id: string): Promise<void>;
}
