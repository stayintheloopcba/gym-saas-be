import { Inject, Injectable } from '@nestjs/common';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { GymNotFoundError } from '../domain/gym.errors';
import { GYM_REPOSITORY } from '../domain/gym.repository';
import type { GymRepository } from '../domain/gym.repository';

/**
 * Soft-delete de una organización. Requiere rol `OWNER`. Tras el borrado el slug
 * queda libre (el índice único es parcial sobre `deleted_at IS NULL`).
 */
@Injectable()
export class DeleteGymUseCase {
  constructor(
    @Inject(GYM_REPOSITORY) private readonly gyms: GymRepository,
    private readonly permissions: GymPermissionService,
  ) {}

  async execute(callerUserId: string, gymId: string): Promise<void> {
    await this.permissions.requirePermission(callerUserId, gymId, PERMISSIONS.GYM_DELETE);

    const gym = await this.gyms.findById(gymId);
    if (!gym) {
      throw new GymNotFoundError(gymId);
    }

    await this.gyms.softDelete(gymId);
  }
}
