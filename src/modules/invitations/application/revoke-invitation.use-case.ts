import { Inject, Injectable } from '@nestjs/common';
import { InvitationStatus } from '../../../common/enums/invitation-status.enum';
import { OrganizationPermissionService } from '../../permissions/application/organization-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { InvitationNotFoundError, InvitationNotPendingError } from '../domain/invitation.errors';
import { INVITATION_REPOSITORY } from '../domain/invitation.repository';
import type { InvitationRepository } from '../domain/invitation.repository';

/**
 * Revoca una invitación pendiente (la marca `REVOKED`). Requiere que el llamador
 * sea `OWNER`/`ADMIN` de la organización dueña de la invitación.
 */
@Injectable()
export class RevokeInvitationUseCase {
  constructor(
    @Inject(INVITATION_REPOSITORY) private readonly invitations: InvitationRepository,
    private readonly permissions: OrganizationPermissionService,
  ) {}

  async execute(callerUserId: string, invitationId: string): Promise<void> {
    const invitation = await this.invitations.findById(invitationId);
    if (!invitation) {
      throw new InvitationNotFoundError();
    }

    await this.permissions.requirePermission(callerUserId, invitation.organizationId, PERMISSIONS.MEMBERS_INVITE);

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new InvitationNotPendingError();
    }

    invitation.status = InvitationStatus.REVOKED;
    await this.invitations.save(invitation);
  }
}
