import { Inject, Injectable } from '@nestjs/common';
import { OrganizationPermissionService } from '../../permissions/application/organization-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { Email } from '../../users/domain/email.vo';
import { Invitation } from '../domain/invitation.entity';
import { INVITATION_REPOSITORY } from '../domain/invitation.repository';
import type { InvitationRepository } from '../domain/invitation.repository';

/**
 * Lista las invitaciones `PENDING` de una organización. Requiere que el llamador
 * sea `OWNER`/`ADMIN`.
 */
@Injectable()
export class ListPendingInvitationsUseCase {
  constructor(
    @Inject(INVITATION_REPOSITORY) private readonly invitations: InvitationRepository,
    private readonly permissions: OrganizationPermissionService,
  ) {}

  async execute(callerUserId: string, organizationId: string): Promise<Invitation[]> {
    await this.permissions.requirePermission(callerUserId, organizationId, PERMISSIONS.MEMBERS_READ);
    return this.invitations.findPendingByOrg(organizationId);
  }
}

/**
 * Lista las invitaciones `PENDING` y no expiradas dirigidas al email del usuario
 * autenticado (las expiradas se descartan en la lectura).
 */
@Injectable()
export class ListMyInvitationsUseCase {
  constructor(@Inject(INVITATION_REPOSITORY) private readonly invitations: InvitationRepository) {}

  async execute(callerEmail: string): Promise<Invitation[]> {
    const email = Email.normalize(callerEmail);
    const now = Date.now();
    const pending = await this.invitations.findPendingByEmail(email);
    return pending.filter((invitation) => invitation.expiresAt.getTime() > now);
  }
}
