/**
 * Estado de una invitación a una organización.
 *
 * - PENDING: emitida, aún aceptable (si no expiró).
 * - ACCEPTED: el invitado se unió (se creó su membresía).
 * - REVOKED: cancelada por un OWNER/ADMIN antes de aceptarse.
 * - EXPIRED: superó `expiresAt` sin aceptarse.
 */
export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REVOKED = 'REVOKED',
  EXPIRED = 'EXPIRED',
}
