import { Gym } from '../domain/gym.entity';

/**
 * Token de inyección para el port transaccional de creación de organizaciones.
 */
export const GYM_UNIT_OF_WORK = Symbol('GYM_UNIT_OF_WORK');

/**
 * Unit-of-work que persiste una organización y su membresía `OWNER` en una sola
 * transacción (ver Decision 5 del design: una org sin owner es un estado inválido).
 *
 * Vive como port para que `CreateGymUseCase` siga siendo agnóstico de
 * TypeORM: la derivación del slug y las validaciones quedan en la aplicación; solo
 * el commit atómico se delega a la infraestructura (`DataSource.transaction`).
 */
export interface GymUnitOfWork {
  /**
   * Persiste `gym` y crea su membresía `OWNER` para `ownerUserId`
   * atómicamente. Devuelve la organización persistida.
   */
  createGymWithOwner(gym: Gym, ownerUserId: string): Promise<Gym>;
}
