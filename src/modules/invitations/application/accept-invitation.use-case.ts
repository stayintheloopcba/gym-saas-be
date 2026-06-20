import { Inject, Injectable } from '@nestjs/common';
import { InvitationStatus } from '../../../common/enums/invitation-status.enum';
import { Membership } from '../../memberships/domain/membership.entity';
import { MEMBERSHIP_REPOSITORY } from '../../memberships/domain/membership.repository';
import type { MembershipRepository } from '../../memberships/domain/membership.repository';
import { Email } from '../../users/domain/email.vo';
import {
  AlreadyMemberError,
  InvitationEmailMismatchError,
  InvitationExpiredError,
  InvitationNotFoundError,
  InvitationNotPendingError,
} from '../domain/invitation.errors';
import { INVITATION_REPOSITORY } from '../domain/invitation.repository';
import type { InvitationRepository } from '../domain/invitation.repository';
import { INVITATION_UNIT_OF_WORK } from './invitation-unit-of-work.port';
import type { InvitationUnitOfWork } from './invitation-unit-of-work.port';

export interface AcceptInvitationCommand {
  callerUserId: string;
  callerEmail: string;
  token: string;
}

/**
 * Acepta una invitación: valida el token, que esté `PENDING` y no expirada, que
 * el email del usuario autenticado coincida y que aún no sea miembro; luego crea
 * la membresía con el rol de la invitación y la marca `ACCEPTED`, atómicamente.
 */
@Injectable()
export class AcceptInvitationUseCase {
  constructor(
    @Inject(INVITATION_REPOSITORY) private readonly invitations: InvitationRepository,
    @Inject(MEMBERSHIP_REPOSITORY) private readonly memberships: MembershipRepository,
    @Inject(INVITATION_UNIT_OF_WORK) private readonly unitOfWork: InvitationUnitOfWork,
  ) {}

  async execute(command: AcceptInvitationCommand): Promise<Membership> {
    const invitation = await this.invitations.findByToken(command.token);
    if (!invitation) {
      throw new InvitationNotFoundError();
    }
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new InvitationNotPendingError();
    }
    if (invitation.expiresAt.getTime() <= Date.now()) {
      throw new InvitationExpiredError();
    }
    if (Email.normalize(invitation.email) !== Email.normalize(command.callerEmail)) {
      throw new InvitationEmailMismatchError();
    }

    const existing = await this.memberships.findByUserAndOrg(command.callerUserId, invitation.organizationId);
    if (existing) {
      throw new AlreadyMemberError();
    }

    const membership = new Membership();
    membership.userId = command.callerUserId;
    membership.organizationId = invitation.organizationId;
    membership.role = invitation.role;

    invitation.status = InvitationStatus.ACCEPTED;

    return this.unitOfWork.acceptInvitation(membership, invitation);
  }
}
