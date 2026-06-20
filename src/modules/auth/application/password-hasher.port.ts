/** Token de inyección para el port `PasswordHasher`. */
export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');

/**
 * Port de hashing de contraseñas. La implementación (bcrypt) vive en
 * infraestructura; los use cases dependen solo de esta interfaz.
 */
export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  compare(plain: string, hash: string): Promise<boolean>;
}
