import { Inject, Injectable } from '@nestjs/common';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { Gym } from '../domain/gym.entity';
import { GymNotFoundError } from '../domain/gym.errors';
import { GYM_REPOSITORY } from '../domain/gym.repository';
import type { GymRepository } from '../domain/gym.repository';

/**
 * Lee una organización por id. El llamador debe ser miembro activo: si no lo es,
 * El servicio de permisos lanza 403 (no se revela la existencia de la org).
 */
@Injectable()
export class GetGymUseCase {
  constructor(
    @Inject(GYM_REPOSITORY) private readonly gyms: GymRepository,
    private readonly permissions: GymPermissionService,
  ) {}

  async execute(callerUserId: string, gymId: string): Promise<Gym> {
    await this.permissions.requirePermission(callerUserId, gymId, PERMISSIONS.ORGANIZATION_READ);

    const gym = await this.gyms.findById(gymId);
    if (!gym) {
      throw new GymNotFoundError(gymId);
    }
    return gym;
  }
}
