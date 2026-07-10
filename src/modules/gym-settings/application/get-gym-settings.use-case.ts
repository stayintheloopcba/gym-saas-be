import { Inject, Injectable } from '@nestjs/common';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { GYM_SETTINGS_REPOSITORY } from '../domain/gym-settings.repository';
import type { GymSettingsRepository } from '../domain/gym-settings.repository';
import { defaultGymSettingsView, GymSettingsView, toGymSettingsView } from '../interfaces/gym-settings.view';

/**
 * Devuelve la configuración del gym, o los defaults de fábrica si todavía no
 * se guardó ninguna (evita forzar un `PUT` inicial antes de poder leer).
 */
@Injectable()
export class GetGymSettingsUseCase {
  constructor(
    @Inject(GYM_SETTINGS_REPOSITORY) private readonly settings: GymSettingsRepository,
    private readonly permissions: GymPermissionService,
  ) {}

  async execute(callerUserId: string, gymId: string): Promise<GymSettingsView> {
    await this.permissions.requirePermission(callerUserId, gymId, PERMISSIONS.SETTINGS_READ);

    const existing = await this.settings.findByGymId(gymId);
    return existing ? toGymSettingsView(existing) : defaultGymSettingsView(gymId);
  }
}
