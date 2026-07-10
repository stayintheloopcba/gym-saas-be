import { Inject, Injectable } from '@nestjs/common';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { Gym } from '../domain/gym.entity';
import { GymNotFoundError } from '../domain/gym.errors';
import { GYM_REPOSITORY } from '../domain/gym.repository';
import type { GymRepository } from '../domain/gym.repository';

/** Campos editables de un gym (parcial). Branding vive en `GymSettings`. */
export interface UpdateGymCommand {
  name?: string;
}

/**
 * Actualiza el nombre de un gym. Requiere `GYM_UPDATE` del llamador. Aplica
 * solo los campos provistos (update parcial). Reemplaza al antiguo
 * `RenameGymUseCase`.
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

    return this.gyms.save(gym);
  }
}
