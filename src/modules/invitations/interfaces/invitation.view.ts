import { InvitationStatus } from '../../../common/enums/invitation-status.enum';
import { RoleSummary } from '../../permissions/domain/role-summary';
import { Invitation } from '../domain/invitation.entity';

/**
 * Forma pública de una invitación. Incluye el `token` porque, sin mailer, es la
 * vía por la que el invitado recibe el enlace de aceptación (MVP).
 */
export interface InvitationView {
  id: string;
  organizationId: string;
  email: string;
  role: RoleSummary;
  status: InvitationStatus;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export function toInvitationView(invitation: Invitation, role: RoleSummary): InvitationView {
  return {
    id: invitation.id,
    organizationId: invitation.organizationId,
    email: invitation.email,
    role,
    status: invitation.status,
    token: invitation.token,
    expiresAt: invitation.expiresAt,
    createdAt: invitation.createdAt,
  };
}
