/**
 * Errores de dominio del módulo de usuarios.
 *
 * Son errores de negocio puros (no dependen de NestJS/HTTP). La capa de
 * interfaces los traduce a respuestas HTTP (p. ej. `DuplicateEmailError` → 409,
 * `UserNotFoundError` → 404/401 según el contexto).
 */
export class DuplicateEmailError extends Error {
  constructor(email: string) {
    super(`A user with email "${email}" already exists`);
    this.name = 'DuplicateEmailError';
  }
}

export class UserNotFoundError extends Error {
  constructor(identifier: string) {
    super(`User not found: ${identifier}`);
    this.name = 'UserNotFoundError';
  }
}
