import { randomBytes } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InvitationStatus } from '../../../common/enums/invitation-status.enum';
import { parseDurationMs } from '../../../common/lib/duration';
import { MEMBERSHIP_REPOSITORY } from '../../memberships/domain/membership.repository';
import type { MembershipRepository } from '../../memberships/domain/membership.repository';
import { OrganizationPermissionService } from '../../permissions/application/organization-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { PERMISSION_REPOSITORY } from '../../permissions/domain/permission.repository';
import type { PermissionRepository } from '../../permissions/domain/permission.repository';
import { Email } from '../../users/domain/email.vo';
import { FindUserByEmailUseCase } from '../../users/application/find-user.use-cases';
import { Invitation } from '../domain/invitation.entity';
import { AlreadyMemberError, OwnerRoleNotInvitableError, UnknownRoleError } from '../domain/invitation.errors';
import { INVITATION_REPOSITORY } from '../domain/invitation.repository';
import type { InvitationRepository } from '../domain/invitation.repository';

const OWNER_ROLE_KEY = 'owner';
const DEFAULT_TTL = '7d';

export interface CreateInvitationCommand {
  callerUserId: string;
  organizationId: string;
  email: string;
  roleId: string;
}

/**
 * Crea una invitación a una organización. Requiere el permiso `members:invite`.
 * Rechaza invitar a un email que ya es miembro activo (`AlreadyMemberError`),
 * un `roleId` desconocido (`UnknownRoleError`) o el rol `owner`
 * (`OwnerRoleNotInvitableError`). Es idempotente: si ya hay una invitación
 * `PENDING` para ese email en la org, la devuelve en vez de duplicarla.
 */
@Injectable()
export class CreateInvitationUseCase {
  private readonly ttlMs: number;

  constructor(
    @Inject(INVITATION_REPOSITORY) private readonly invitations: InvitationRepository,
    @Inject(MEMBERSHIP_REPOSITORY) private readonly memberships: MembershipRepository,
    @Inject(PERMISSION_REPOSITORY) private readonly permissionsRepo: PermissionRepository,
    private readonly findUserByEmail: FindUserByEmailUseCase,
    private readonly permissions: OrganizationPermissionService,
    config: ConfigService,
  ) {
    this.ttlMs = parseDurationMs(config.get<string>('INVITATION_TTL', DEFAULT_TTL));
  }

  async execute(command: CreateInvitationCommand): Promise<Invitation> {
    const { callerUserId, organizationId, roleId } = command;
    const email = Email.normalize(command.email);

    await this.permissions.requirePermission(callerUserId, organizationId, PERMISSIONS.MEMBERS_INVITE);

    const role = await this.permissionsRepo.findRoleSummary(roleId);
    if (!role) {
      throw new UnknownRoleError(roleId);
    }
    if (role.key === OWNER_ROLE_KEY) {
      throw new OwnerRoleNotInvitableError();
    }

    // Si el email pertenece a un usuario que ya es miembro activo, no se invita.
    const invitedUser = await this.findUserByEmail.execute(email);
    if (invitedUser) {
      const existingMembership = await this.memberships.findByUserAndOrg(invitedUser.id, organizationId);
      if (existingMembership) {
        throw new AlreadyMemberError();
      }
    }

    // Idempotencia: reutiliza la invitación pendiente existente.
    const pending = await this.invitations.findPendingByOrgAndEmail(organizationId, email);
    if (pending) {
      return pending;
    }

    const invitation = new Invitation();
    invitation.organizationId = organizationId;
    invitation.email = email;
    invitation.roleId = role.id;
    invitation.token = randomBytes(32).toString('hex');
    invitation.status = InvitationStatus.PENDING;
    invitation.expiresAt = new Date(Date.now() + this.ttlMs);

    return this.invitations.save(invitation);
  }
}
