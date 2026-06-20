import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthProvider } from '../../../common/enums/auth-provider.enum';
import { FindUserByEmailUseCase } from '../../users/application/find-user.use-cases';
import { toPublicProfile } from '../../users/application/user-public-profile';
import { SessionMetadata, SessionService } from '../../sessions/application/session.service';
import { AuthResult } from './auth-result';
import { PASSWORD_HASHER } from './password-hasher.port';
import type { PasswordHasher } from './password-hasher.port';

export interface LoginCommand {
  email: string;
  password: string;
  session?: SessionMetadata;
}

/**
 * Login con email + password. Rechaza con 401 (mensaje genérico para no
 * filtrar si el email existe) cuando el usuario no existe, no es LOCAL, no tiene
 * password, o la contraseña no coincide.
 */
@Injectable()
export class LoginUseCase {
  constructor(
    private readonly findByEmail: FindUserByEmailUseCase,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    private readonly sessions: SessionService,
  ) {}

  async execute(command: LoginCommand): Promise<AuthResult> {
    const user = await this.findByEmail.execute(command.email);

    if (!user || user.provider !== AuthProvider.LOCAL || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const matches = await this.hasher.compare(command.password, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const profile = toPublicProfile(user);
    const tokens = await this.sessions.start(profile, command.session);
    return { user: profile, tokens };
  }
}
