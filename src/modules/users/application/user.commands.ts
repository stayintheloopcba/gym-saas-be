import { AuthProvider } from '../../../common/enums/auth-provider.enum';

/**
 * Comando interno para crear un usuario. No es un DTO HTTP: lo construyen los
 * use cases de auth (registro local, alta vía Google), no llega directo del
 * request.
 */
export interface CreateUserCommand {
  email: string;
  name: string;
  provider: AuthProvider;
  /** Requerido para provider LOCAL. */
  passwordHash?: string;
  /** Requerido para provider GOOGLE. */
  googleId?: string;
}
