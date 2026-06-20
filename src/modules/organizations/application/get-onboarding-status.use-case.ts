import { Injectable } from '@nestjs/common';
import { AuthContextService } from '../../../common/context/auth-context.service';
import { Invitation } from '../../invitations/domain/invitation.entity';
import { ListMyInvitationsUseCase } from '../../invitations/application/list-invitations.use-cases';
import { ListMyOrganizationsUseCase } from './list-my-organizations.use-case';

/**
 * Señal de onboarding para el frontend: ¿el usuario necesita onboarding (no tiene
 * ninguna organización), cuál es su organización activa válida y qué invitaciones
 * pendientes tiene dirigidas a su email?
 */
export interface OnboardingStatus {
  /** `true` cuando el usuario no pertenece a ninguna organización. */
  needsOnboarding: boolean;
  organizationsCount: number;
  hasActiveOrganization: boolean;
  activeOrganizationId: string | null;
  pendingInvitations: Invitation[];
}

@Injectable()
export class GetOnboardingStatusUseCase {
  constructor(
    private readonly listMyOrganizations: ListMyOrganizationsUseCase,
    private readonly listMyInvitations: ListMyInvitationsUseCase,
    private readonly authContext: AuthContextService,
  ) {}

  async execute(callerUserId: string, callerEmail: string): Promise<OnboardingStatus> {
    const organizations = await this.listMyOrganizations.execute(callerUserId);
    const pendingInvitations = await this.listMyInvitations.execute(callerEmail);
    const activeOrganizationId = this.authContext.getActiveOrganizationId() ?? null;

    return {
      needsOnboarding: organizations.length === 0,
      organizationsCount: organizations.length,
      hasActiveOrganization: activeOrganizationId !== null,
      activeOrganizationId,
      pendingInvitations,
    };
  }
}
