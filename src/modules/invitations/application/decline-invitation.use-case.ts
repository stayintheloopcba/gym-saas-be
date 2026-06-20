import { Inject, Injectable } from '@nestjs/common';
import { InvitationStatus } from '../../../common/enums/invitation-status.enum';
import { Email } from '../../users/domain/email.vo';
import {
  InvitationEmailMismatchError,
  InvitationNotFoundError,
  InvitationNotPendingError,
} from '../domain/invitation.errors';
import { INVITATION_REPOSITORY } from '../domain/invitation.repository';
import type { InvitationRepository } from '../domain/invitation.repository';

export interface DeclineInvitationCommand {
  callerEmail: string;
  token: string;
}

/**
 * Rechaza una invitación dirigida al usuario autenticado: valida el token y que
 * el email coincida, y la marca `REVOKED` (no hay estado DECLINED en el MVP). No
 * crea ninguna membresía.
 */
@Injectable()
export class DeclineInvitationUseCase {
  constructor(@Inject(INVITATION_REPOSITORY) private readonly invitations: InvitationRepository) {}

  async execute(command: DeclineInvitationCommand): Promise<void> {
    const invitation = await this.invitations.findByToken(command.token);
    if (!invitation) {
      throw new InvitationNotFoundError();
    }
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new InvitationNotPendingError();
    }
    if (Email.normalize(invitation.email) !== Email.normalize(command.callerEmail)) {
      throw new InvitationEmailMismatchError();
    }

    invitation.status = InvitationStatus.REVOKED;
    await this.invitations.save(invitation);
  }
}
