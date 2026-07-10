import { Inject, Injectable } from '@nestjs/common';
import { PaymentMethod } from '../../../common/enums/payment-method.enum';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { GymSettings } from '../domain/gym-settings.entity';
import { GYM_SETTINGS_REPOSITORY } from '../domain/gym-settings.repository';
import type { GymSettingsRepository } from '../domain/gym-settings.repository';
import { GymSettingsView, toGymSettingsView } from '../interfaces/gym-settings.view';

export interface UpdateGymSettingsCommand {
  callerUserId: string;
  gymId: string;
  displayName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  theme?: string;
  timezone: string;
  currency: string;
  openingHours?: Record<string, unknown>;
  contactEmail?: string;
  contactPhone?: string;
  moraGraceDays: number;
  moraSurchargePct: number;
  renewalPolicy?: Record<string, unknown>;
  enabledPaymentMethods: PaymentMethod[];
}

/**
 * Reemplaza por completo la configuración del gym (`PUT`, no parcial), salvo
 * `logoUrl`/`bannerUrl`: esos los maneja `POST /gyms/:id/logo|banner`
 * (`SetGymImageUseCase`) y este use case nunca los toca. Crea la fila si el
 * gym todavía no tenía settings guardados.
 */
@Injectable()
export class UpdateGymSettingsUseCase {
  constructor(
    @Inject(GYM_SETTINGS_REPOSITORY) private readonly repository: GymSettingsRepository,
    private readonly permissions: GymPermissionService,
  ) {}

  async execute(command: UpdateGymSettingsCommand): Promise<GymSettingsView> {
    await this.permissions.requirePermission(command.callerUserId, command.gymId, PERMISSIONS.SETTINGS_UPDATE);

    const settings = (await this.repository.findByGymId(command.gymId)) ?? new GymSettings();
    settings.gymId = command.gymId;
    settings.displayName = command.displayName ?? null;
    settings.primaryColor = command.primaryColor ?? null;
    settings.secondaryColor = command.secondaryColor ?? null;
    settings.fontFamily = command.fontFamily ?? null;
    settings.theme = command.theme ?? null;
    settings.timezone = command.timezone;
    settings.currency = command.currency;
    settings.openingHours = command.openingHours ?? null;
    settings.contactEmail = command.contactEmail ?? null;
    settings.contactPhone = command.contactPhone ?? null;
    settings.moraGraceDays = command.moraGraceDays;
    settings.moraSurchargePct = command.moraSurchargePct;
    settings.renewalPolicy = command.renewalPolicy ?? null;
    settings.enabledPaymentMethods = command.enabledPaymentMethods;

    const saved = await this.repository.save(settings);
    return toGymSettingsView(saved);
  }
}
