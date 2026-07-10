import { Inject, Injectable } from '@nestjs/common';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { Gym } from '../domain/gym.entity';
import { GymNotFoundError } from '../domain/gym.errors';
import { GYM_REPOSITORY } from '../domain/gym.repository';
import type { GymRepository } from '../domain/gym.repository';

/** Campos editables de una organización (parcial). */
export interface UpdateGymCommand {
  name?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
}

/**
 * Actualiza nombre y/o branding de una organización. Requiere `GYM_UPDATE`
 * del llamador. Aplica solo los campos provistos (update parcial). Reemplaza al
 * antiguo `RenameGymUseCase`.
 */
@Injectable()
export class UpdateGymUseCase {
  constructor(
    @Inject(GYM_REPOSITORY) private readonly gyms: GymRepository,
    private readonly permissions: GymPermissionService,
  ) {}

  async execute(callerUserId: string, gymId: string, patch: UpdateGymCommand): Promise<Gym> {
    await this.permissions.requirePermission(callerUserId, gymId, PERMISSIONS.GYM_UPDATE);

    const gym = await this.gyms.findById(gymId);
    if (!gym) {
      throw new GymNotFoundError(gymId);
    }

    if (patch.name !== undefined) {
      gym.name = patch.name.trim();
    }
    if (patch.primaryColor !== undefined) {
      gym.primaryColor = patch.primaryColor;
    }
    if (patch.secondaryColor !== undefined) {
      gym.secondaryColor = patch.secondaryColor;
    }
    if (patch.fontFamily !== undefined) {
      gym.fontFamily = patch.fontFamily;
    }

    return this.gyms.save(gym);
  }
}
