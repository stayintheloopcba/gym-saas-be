/**
 * Port mínimo que `common` necesita para validar la organización activa de un
 * request sin depender de TypeORM ni del módulo de memberships.
 *
 * Lo implementa el módulo de memberships (`TypeOrmMembershipContextAdapter`) y
 * lo consume `AuthContextMiddleware`: la cookie `active_gym` solo se acepta si
 * el usuario tiene una membresía activa en esa organización.
 */
export const MEMBERSHIP_CONTEXT_PORT = Symbol('MEMBERSHIP_CONTEXT_PORT');

export interface MembershipContextPort {
  /** `true` si existe una membresía no eliminada para el par (usuario, organización). */
  isActiveMember(userId: string, gymId: string): Promise<boolean>;
}

/** Nombre de la cookie httpOnly que transporta la organización activa. */
export const ACTIVE_GYM_COOKIE = 'active_gym';
