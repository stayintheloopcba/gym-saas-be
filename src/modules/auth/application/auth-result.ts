import { TokenPair } from './token-service.port';
import { UserPublicProfile } from '../../users/application/user-public-profile';

/**
 * Resultado de una autenticación exitosa: el perfil público del usuario y el
 * par de tokens. La capa de interfaces coloca los tokens en cookies httpOnly y
 * devuelve solo el perfil en el body.
 */
export interface AuthResult {
  user: UserPublicProfile;
  tokens: TokenPair;
  /**
   * Organización a marcar como activa tras autenticar (cookie `active_gym`).
   * La setea el registro self-serve, que provisiona una org junto al usuario.
   */
  activeGymId?: string;
}
