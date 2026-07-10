import { DomainError } from '../../../common/errors/domain-error';

/**
 * Errores de dominio del módulo de memberships. Extienden `DomainError` y
 * declaran su `status` HTTP (traducido por `DomainExceptionFilter`).
 */
export class DuplicateMembershipError extends DomainError {
  readonly status = 409;

  constructor(userId: string, gymId: string) {
    super(`User ${userId} already has a membership in gym ${gymId}`);
  }
}

export class MembershipNotFoundError extends DomainError {
  readonly status = 404;

  constructor(identifier: string) {
    super(`Membership not found: ${identifier}`);
  }
}

/** No se puede remover/degradar al único `owner` de una organización. */
export class SoleOwnerError extends DomainError {
  readonly status = 409;

  constructor() {
    super('The sole owner of an gym cannot be removed or demoted');
  }
}

/** Un miembro no puede cambiar su propio rol (evita auto-promoción). */
export class CannotChangeOwnRoleError extends DomainError {
  readonly status = 409;

  constructor() {
    super('You cannot change your own role');
  }
}

/** El `roleId` no corresponde a ningún rol del catálogo. */
export class UnknownRoleError extends DomainError {
  readonly status = 404;

  constructor(roleId: string) {
    super(`Unknown role: ${roleId}`);
  }
}

/** El rol `owner` solo se otorga automáticamente al crear la organización. */
export class OwnerRoleNotAssignableError extends DomainError {
  readonly status = 409;

  constructor() {
    super('The owner role cannot be assigned through this operation');
  }
}
