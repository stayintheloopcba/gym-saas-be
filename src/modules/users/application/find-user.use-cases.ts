import { Inject, Injectable } from '@nestjs/common';
import { Email } from '../domain/email.vo';
import { User } from '../domain/user.entity';
import { USER_REPOSITORY } from '../domain/user.repository';
import type { UserRepository } from '../domain/user.repository';

/**
 * Casos de uso de lectura de usuarios. Todas las búsquedas excluyen registros
 * soft-deleted (delegado en el repositorio / TypeORM).
 */
@Injectable()
export class FindUserByIdUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepository) {}

  execute(id: string): Promise<User | null> {
    return this.users.findById(id);
  }
}

@Injectable()
export class FindUserByEmailUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepository) {}

  execute(email: string): Promise<User | null> {
    return this.users.findByEmail(Email.normalize(email));
  }
}

@Injectable()
export class FindUserByGoogleIdUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepository) {}

  execute(googleId: string): Promise<User | null> {
    return this.users.findByGoogleId(googleId);
  }
}
