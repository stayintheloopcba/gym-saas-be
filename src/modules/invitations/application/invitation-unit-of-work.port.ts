import { Membership } from '../../memberships/domain/membership.entity';
import { Invitation } from '../domain/invitation.entity';

/**
 * Token de inyección para el port transaccional de aceptación de invitaciones.
 */
export const INVITATION_UNIT_OF_WORK = Symbol('INVITATION_UNIT_OF_WORK');

/**
 * Unit-of-work que materializa la aceptación de una invitación: persiste la nueva
 * `Membership` y marca la `Invitation` como `ACCEPTED` en una sola transacción,
 * para que nunca quede un estado a medias (membresía sin invitación resuelta o
 * viceversa). La aplicación depende del port; el commit atómico vive en infra.
 */
export interface InvitationUnitOfWork {
  acceptInvitation(membership: Membership, invitation: Invitation): Promise<Membership>;
}
