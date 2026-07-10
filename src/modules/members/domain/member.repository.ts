import { Member } from './member.entity';

/** Token de inyección para el port `MemberRepository`. */
export const MEMBER_REPOSITORY = Symbol('MEMBER_REPOSITORY');

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
  save(member: Member): Promise<Member>;
  softDelete(id: string): Promise<void>;
}
