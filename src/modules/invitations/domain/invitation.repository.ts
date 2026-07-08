import { EntityManager } from 'typeorm';
import { Invitation } from './invitation.entity';

/**
 * Token de inyección para el port `InvitationRepository`.
 *
 * La infraestructura lo vincula a `TypeOrmInvitationRepository`; la capa de
 * aplicación inyecta el port por este token, nunca el `Repository<Invitation>`.
 */
export const INVITATION_REPOSITORY = Symbol('INVITATION_REPOSITORY');

/**
 * Port de persistencia del agregado `Invitation`. Las búsquedas excluyen
 * registros soft-deleted. "Pending" se interpreta por el campo `status`
 * (`PENDING`); la expiración se evalúa en la capa de aplicación.
 *
 * `save` acepta un `EntityManager` opcional para participar en la transacción de
 * aceptación (crear membresía + marcar `ACCEPTED` atómicamente).
 */
export interface InvitationRepository {
  findById(id: string): Promise<Invitation | null>;
  findByToken(token: string): Promise<Invitation | null>;
  findPendingByOrgAndEmail(organizationId: string, email: string): Promise<Invitation | null>;
  findPendingByOrg(organizationId: string): Promise<Invitation[]>;
  findPendingByEmail(email: string): Promise<Invitation[]>;
  /** Cantidad de invitaciones `PENDING` que apuntan a un rol dado (para "rol en uso"). */
  countPendingByRole(roleId: string): Promise<number>;
  save(invitation: Invitation, manager?: EntityManager): Promise<Invitation>;
}
