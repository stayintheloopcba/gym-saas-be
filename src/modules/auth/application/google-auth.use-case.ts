import { Inject, Injectable } from '@nestjs/common';
import { AuthProvider } from '../../../common/enums/auth-provider.enum';
import { CreateUserUseCase } from '../../users/application/create-user.use-case';
import { FindUserByEmailUseCase, FindUserByGoogleIdUseCase } from '../../users/application/find-user.use-cases';
import { toPublicProfile } from '../../users/application/user-public-profile';
import { USER_REPOSITORY } from '../../users/domain/user.repository';
import type { UserRepository } from '../../users/domain/user.repository';
import { SessionMetadata, SessionService } from '../../sessions/application/session.service';
import { AuthResult } from './auth-result';

/** Perfil mínimo que entrega la estrategia de Google tras validar el code. */
export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
}

/**
 * Autentica vía Google resolviendo en tres pasos:
 * 1. Por `googleId` → usuario recurrente.
 * 2. Si no, por email → vincula el `googleId` a la cuenta existente.
 * 3. Si no, crea un usuario GOOGLE nuevo.
 * En todos los casos emite el mismo par de tokens que el login local.
 */
@Injectable()
export class GoogleAuthUseCase {
  constructor(
    private readonly findByGoogleId: FindUserByGoogleIdUseCase,
    private readonly findByEmail: FindUserByEmailUseCase,
    private readonly createUser: CreateUserUseCase,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly sessions: SessionService,
  ) {}

  async execute(profile: GoogleProfile, metadata: SessionMetadata = {}): Promise<AuthResult> {
    let user = await this.findByGoogleId.execute(profile.googleId);

    if (!user) {
      const existingByEmail = await this.findByEmail.execute(profile.email);
      if (existingByEmail) {
        // Vincula Google a la cuenta existente (típicamente una cuenta LOCAL).
        existingByEmail.googleId = profile.googleId;
        user = await this.users.save(existingByEmail);
      } else {
        user = await this.createUser.execute({
          email: profile.email,
          name: profile.name,
          provider: AuthProvider.GOOGLE,
          googleId: profile.googleId,
        });
      }
    }

    const publicProfile = toPublicProfile(user);
    const tokens = await this.sessions.start(publicProfile, metadata);
    return { user: publicProfile, tokens };
  }
}
