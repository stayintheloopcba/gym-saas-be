import { User } from './user.entity';

/**
 * Token de inyección para el port `UserRepository`.
 *
 * La capa de infraestructura vincula este token a la implementación TypeORM
 * (`TypeOrmUserRepository`) en el módulo. La capa de aplicación inyecta el port
 * por este token, nunca el `Repository<User>` de TypeORM.
 */
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

/**
 * Port de persistencia del agregado `User`.
 *
 * Todas las búsquedas excluyen registros soft-deleted (TypeORM lo hace por
 * defecto al respetar `@DeleteDateColumn`).
 */
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByGoogleId(googleId: string): Promise<User | null>;
  save(user: User): Promise<User>;
}
