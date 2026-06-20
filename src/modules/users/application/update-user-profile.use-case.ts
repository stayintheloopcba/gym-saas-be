import { Inject, Injectable } from '@nestjs/common';
import { User } from '../domain/user.entity';
import { UserNotFoundError } from '../domain/user.errors';
import { USER_REPOSITORY } from '../domain/user.repository';
import type { UserRepository } from '../domain/user.repository';

/** Campos editables del perfil propio (parcial). `avatarUrl` se setea en Fase B. */
export interface UpdateUserProfileCommand {
  name?: string;
}

/** Actualiza el perfil del usuario autenticado (de momento, su nombre). */
@Injectable()
export class UpdateUserProfileUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepository) {}

  async execute(userId: string, patch: UpdateUserProfileCommand): Promise<User> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    if (patch.name !== undefined) {
      user.name = patch.name.trim();
    }

    return this.users.save(user);
  }
}
