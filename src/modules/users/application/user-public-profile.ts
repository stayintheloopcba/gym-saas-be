import { AuthProvider } from '../../../common/enums/auth-provider.enum';
import { User } from '../domain/user.entity';

/**
 * Vista pública de un usuario: nunca incluye `passwordHash`. Es la forma en que
 * el usuario se expone en las respuestas HTTP (`/auth/me`, register, login).
 */
export interface UserPublicProfile {
  id: string;
  email: string;
  name: string;
  provider: AuthProvider;
  createdAt: Date;
  avatarUrl: string | null;
}

/** Mapea un `User` a su perfil público, descartando datos sensibles. */
export function toPublicProfile(user: User): UserPublicProfile {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    provider: user.provider,
    createdAt: user.createdAt,
    avatarUrl: user.avatarUrl ?? null,
  };
}
