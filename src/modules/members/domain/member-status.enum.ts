/**
 * Estado del `Member`. `OVERDUE` nunca se persiste: se deriva en lectura a
 * partir de `paidUntil + moraGraceDays` (ver `subscriptions`/`payments`).
 */
export enum MemberStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  OVERDUE = 'OVERDUE',
  INACTIVE = 'INACTIVE',
}
