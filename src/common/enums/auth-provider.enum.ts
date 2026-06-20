/**
 * Origen de autenticación de un usuario.
 *
 * - LOCAL: registrado con email + password (tiene `passwordHash`).
 * - GOOGLE: autenticado vía Google OAuth (tiene `googleId`, sin password).
 */
export enum AuthProvider {
  LOCAL = 'LOCAL',
  GOOGLE = 'GOOGLE',
}
