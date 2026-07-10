import { Inject, Injectable } from '@nestjs/common';
import { AuthProvider } from '../../../common/enums/auth-provider.enum';
import { CreateGymUseCase } from '../../gyms/application/create-gym.use-case';
import { CreateUserUseCase } from '../../users/application/create-user.use-case';
import { toPublicProfile } from '../../users/application/user-public-profile';
import { SessionMetadata, SessionService } from '../../sessions/application/session.service';
import { AuthResult } from './auth-result';
import { PASSWORD_HASHER } from './password-hasher.port';
import type { PasswordHasher } from './password-hasher.port';

export interface RegisterCommand {
  email: string;
  password: string;
  name: string;
  gymName: string;
  session?: SessionMetadata;
}

/**
 * Registro self-serve: hashea la contraseña, crea el usuario LOCAL y, en el mismo
 * flujo, provisiona su organización (membresía `OWNER`, atómica) y emite tokens.
 * Devuelve la org creada como `activeGymId` para que la capa de interfaces
 * la deje activa.
 *
 * La creación de usuario y la de organización no comparten transacción: si la org
 * falla tras crear el usuario, se propaga el error y el usuario queda apto para el
 * onboarding clásico (crear org / aceptar invitación).
 */
@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly createUser: CreateUserUseCase,
    private readonly createGym: CreateGymUseCase,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    private readonly sessions: SessionService,
  ) {}

  async execute(command: RegisterCommand): Promise<AuthResult> {
    const passwordHash = await this.hasher.hash(command.password);

    const user = await this.createUser.execute({
      email: command.email,
      name: command.name,
      provider: AuthProvider.LOCAL,
      passwordHash,
    });

    const gym = await this.createGym.execute({
      ownerUserId: user.id,
      name: command.gymName,
    });

    const profile = toPublicProfile(user);
    const tokens = await this.sessions.start(profile, command.session);
    return { user: profile, tokens, activeGymId: gym.id };
  }
}
