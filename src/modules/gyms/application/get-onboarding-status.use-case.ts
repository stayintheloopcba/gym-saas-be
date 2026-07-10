import { Injectable } from '@nestjs/common';
import { AuthContextService } from '../../../common/context/auth-context.service';
import { ListMyGymsUseCase } from './list-my-gyms.use-case';

/**
 * Señal de onboarding para el frontend: ¿el usuario necesita onboarding (no tiene
 * ninguna organización) y cuál es su organización activa válida?
 */
export interface OnboardingStatus {
  /** `true` cuando el usuario no pertenece a ninguna organización. */
  needsOnboarding: boolean;
  gymsCount: number;
  hasActiveGym: boolean;
  activeGymId: string | null;
}

@Injectable()
export class GetOnboardingStatusUseCase {
  constructor(
    private readonly listMyGyms: ListMyGymsUseCase,
    private readonly authContext: AuthContextService,
  ) {}

  async execute(callerUserId: string): Promise<OnboardingStatus> {
    const gyms = await this.listMyGyms.execute(callerUserId);
    const activeGymId = this.authContext.getActiveGymId() ?? null;

    return {
      needsOnboarding: gyms.length === 0,
      gymsCount: gyms.length,
      hasActiveGym: activeGymId !== null,
      activeGymId,
    };
  }
}
