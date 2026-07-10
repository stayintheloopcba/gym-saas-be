import { randomUUID } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { FILE_STORAGE } from '../../storage/domain/file-storage.port';
import type { FileStorage } from '../../storage/domain/file-storage.port';
import { ImageUploadValidator, UploadCandidate } from '../../storage/application/image-upload.validator';
import { Gym } from '../domain/gym.entity';
import { GymNotFoundError } from '../domain/gym.errors';
import { GYM_REPOSITORY } from '../domain/gym.repository';
import type { GymRepository } from '../domain/gym.repository';

/** Imagen de marca que se puede subir a una organización. */
export type GymImageTarget = 'logo' | 'banner';

/**
 * Sube el logo o el banner de una organización a MinIO y persiste su URL.
 *
 * Requiere `ORGANIZATION_UPDATE` del llamador. Valida tipo y tamaño de la imagen
 * (`ImageUploadValidator`) y genera una key con uuid para evitar enumeración y
 * cache stale (`gym/<id>/<target>-<uuid>.<ext>`).
 */
@Injectable()
export class SetGymImageUseCase {
  constructor(
    @Inject(GYM_REPOSITORY) private readonly gyms: GymRepository,
    private readonly permissions: GymPermissionService,
    @Inject(FILE_STORAGE) private readonly storage: FileStorage,
    private readonly validator: ImageUploadValidator,
  ) {}

  async execute(
    callerUserId: string,
    gymId: string,
    target: GymImageTarget,
    file: UploadCandidate | undefined,
  ): Promise<Gym> {
    await this.permissions.requirePermission(callerUserId, gymId, PERMISSIONS.ORGANIZATION_UPDATE);
    this.validator.validate(file);

    const gym = await this.gyms.findById(gymId);
    if (!gym) {
      throw new GymNotFoundError(gymId);
    }

    const key = `gym/${gymId}/${target}-${randomUUID()}.${this.validator.extensionFor(file.mimetype)}`;
    const url = await this.storage.put({ key, buffer: file.buffer, contentType: file.mimetype });

    if (target === 'logo') {
      gym.logoUrl = url;
    } else {
      gym.bannerUrl = url;
    }

    return this.gyms.save(gym);
  }
}
