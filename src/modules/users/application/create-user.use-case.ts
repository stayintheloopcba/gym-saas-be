import { Inject, Injectable } from '@nestjs/common';
import { Email } from '../domain/email.vo';
import { User } from '../domain/user.entity';
import { DuplicateEmailError } from '../domain/user.errors';
import { USER_REPOSITORY } from '../domain/user.repository';
import type { UserRepository } from '../domain/user.repository';
import { CreateUserCommand } from './user.commands';

/**
 * Crea un usuario. Normaliza el email, rechaza duplicados y arma el agregado
 * según el provider (LOCAL con `passwordHash`, GOOGLE con `googleId` y sin
 * password).
 */
@Injectable()
export class CreateUserUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepository) {}

  async execute(command: CreateUserCommand): Promise<User> {
    const email = Email.normalize(command.email);

    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new DuplicateEmailError(email);
    }

    const user = new User();
    user.email = email;
    user.name = command.name.trim();
    user.provider = command.provider;
    user.passwordHash = command.passwordHash ?? null;
    user.googleId = command.googleId ?? null;

    return this.users.save(user);
  }
}
