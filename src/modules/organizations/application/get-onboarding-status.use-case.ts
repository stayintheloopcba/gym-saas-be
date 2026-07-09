import { Injectable } from '@nestjs/common';
import { AuthContextService } from '../../../common/context/auth-context.service';
import { ListMyOrganizationsUseCase } from './list-my-organizations.use-case';

/**
 * Señal de onboarding para el frontend: ¿el usuario necesita onboarding (no tiene
 * ninguna organización) y cuál es su organización activa válida?
 */
export interface OnboardingStatus {
  /** `true` cuando el usuario no pertenece a ninguna organización. */
  needsOnboarding: boolean;
  organizationsCount: number;
  hasActiveOrganization: boolean;
  activeOrganizationId: string | null;
}

@Injectable()
export class GetOnboardingStatusUseCase {
  constructor(
    private readonly listMyOrganizations: ListMyOrganizationsUseCase,
    private readonly authContext: AuthContextService,
  ) {}

  async execute(callerUserId: string): Promise<OnboardingStatus> {
    const organizations = await this.listMyOrganizations.execute(callerUserId);
    const activeOrganizationId = this.authContext.getActiveOrganizationId() ?? null;

    return {
      needsOnboarding: organizations.length === 0,
      organizationsCount: organizations.length,
      hasActiveOrganization: activeOrganizationId !== null,
      activeOrganizationId,
    };
  }
}
