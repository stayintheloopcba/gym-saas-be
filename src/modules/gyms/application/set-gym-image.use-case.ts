import { randomUUID } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import { GYM_SETTINGS_REPOSITORY } from '../../gym-settings/domain/gym-settings.repository';
import type { GymSettingsRepository } from '../../gym-settings/domain/gym-settings.repository';
import { GymSettings } from '../../gym-settings/domain/gym-settings.entity';
import { GymSettingsView, toGymSettingsView } from '../../gym-settings/interfaces/gym-settings.view';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { FILE_STORAGE } from '../../storage/domain/file-storage.port';
import type { FileStorage } from '../../storage/domain/file-storage.port';
import { ImageUploadValidator, UploadCandidate } from '../../storage/application/image-upload.validator';
import { GymNotFoundError } from '../domain/gym.errors';
import { GYM_REPOSITORY } from '../domain/gym.repository';
import type { GymRepository } from '../domain/gym.repository';

/** Imagen de marca que se puede subir a un gym. */
export type GymImageTarget = 'logo' | 'banner';

/**
 * Sube el logo o el banner de un gym a MinIO y persiste su URL en
 * `GymSettings` (Decision #4 técnica: branding vive en settings, no en `Gym`).
 *
 * Requiere `GYM_UPDATE` del llamador. Valida tipo y tamaño de la imagen
 * (`ImageUploadValidator`) y genera una key con uuid para evitar enumeración y
 * cache stale (`gym/<id>/<target>-<uuid>.<ext>`).
 */
@Injectable()
export class SetGymImageUseCase {
  constructor(
    @Inject(GYM_REPOSITORY) private readonly gyms: GymRepository,
    @Inject(GYM_SETTINGS_REPOSITORY) private readonly settingsRepo: GymSettingsRepository,
    private readonly permissions: GymPermissionService,
    @Inject(FILE_STORAGE) private readonly storage: FileStorage,
    private readonly validator: ImageUploadValidator,
  ) {}

  async execute(
    callerUserId: string,
    gymId: string,
    target: GymImageTarget,
    file: UploadCandidate | undefined,
  ): Promise<GymSettingsView> {
    await this.permissions.requirePermission(callerUserId, gymId, PERMISSIONS.GYM_UPDATE);
    this.validator.validate(file);

    const gym = await this.gyms.findById(gymId);
    if (!gym) {
      throw new GymNotFoundError(gymId);
    }

    const key = `gym/${gymId}/${target}-${randomUUID()}.${this.validator.extensionFor(file.mimetype)}`;
    const url = await this.storage.put({ key, buffer: file.buffer, contentType: file.mimetype });

    const settings = (await this.settingsRepo.findByGymId(gymId)) ?? new GymSettings();
    settings.gymId = gymId;
    if (target === 'logo') {
      settings.logoUrl = url;
    } else {
      settings.bannerUrl = url;
    }

    const saved = await this.settingsRepo.save(settings);
    return toGymSettingsView(saved);
  }
}
