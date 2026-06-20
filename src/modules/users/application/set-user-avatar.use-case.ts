import { randomUUID } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import { ImageUploadValidator, UploadCandidate } from '../../storage/application/image-upload.validator';
import { FILE_STORAGE } from '../../storage/domain/file-storage.port';
import type { FileStorage } from '../../storage/domain/file-storage.port';
import { User } from '../domain/user.entity';
import { UserNotFoundError } from '../domain/user.errors';
import { USER_REPOSITORY } from '../domain/user.repository';
import type { UserRepository } from '../domain/user.repository';

/**
 * Sube el avatar del usuario autenticado a MinIO y persiste su `avatarUrl`.
 *
 * Valida tipo y tamaño (`ImageUploadValidator`) y genera una key con uuid
 * (`users/<id>/avatar-<uuid>.<ext>`).
 */
@Injectable()
export class SetUserAvatarUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(FILE_STORAGE) private readonly storage: FileStorage,
    private readonly validator: ImageUploadValidator,
  ) {}

  async execute(userId: string, file: UploadCandidate | undefined): Promise<User> {
    this.validator.validate(file);

    const user = await this.users.findById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    const key = `users/${userId}/avatar-${randomUUID()}.${this.validator.extensionFor(file.mimetype)}`;
    user.avatarUrl = await this.storage.put({ key, buffer: file.buffer, contentType: file.mimetype });

    return this.users.save(user);
  }
}
