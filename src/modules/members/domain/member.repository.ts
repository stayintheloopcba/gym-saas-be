import { Member } from './member.entity';
import { MemberStatus } from './member-status.enum';

/** Token de inyección para el port `MemberRepository`. */
export const MEMBER_REPOSITORY = Symbol('MEMBER_REPOSITORY');

export interface MemberListFilters {
  status?: MemberStatus;
  /** `key` del catálogo de roles (no `roleId`): resuelto a `roleId` por la infraestructura. */
  roleKey?: string;
  branchId?: string;
  /** Texto libre sobre `firstName`/`lastName`/`documentId`/`email`. */
  search?: string;
}

/**
 * Port de persistencia del agregado `Member`.
 *
 * Todas las búsquedas excluyen registros soft-deleted (TypeORM respeta
 * `@DeleteDateColumn`), por lo que las búsquedas por `userId`/`documentId`
 * solo ven Members activos (claves libres para reutilizarse tras un remove).
 */
export interface MemberRepository {
  findById(gymId: string, id: string): Promise<Member | null>;
  findByGymAndUserId(gymId: string, userId: string): Promise<Member | null>;
  findByGymAndDocumentId(gymId: string, documentId: string): Promise<Member | null>;
  /** Todos los Members (de cualquier gym) del usuario, p. ej. para listar "mis gyms". */
  findByUserId(userId: string): Promise<Member[]>;
  list(gymId: string, filters: MemberListFilters): Promise<Member[]>;
  /** Cantidad de Members activos de un gym con un rol dado (p. ej. contar owners). */
  countByRoleInGym(gymId: string, roleId: string): Promise<number>;
  /** Cantidad de Members activos (en cualquier gym) que usan un rol dado (para "rol en uso"). */
  countByRole(roleId: string): Promise<number>;
  save(member: Member): Promise<Member>;
  softDelete(id: string): Promise<void>;
}
