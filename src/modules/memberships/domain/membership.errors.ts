import { DomainError } from '../../../common/errors/domain-error';

/**
 * Errores de dominio del módulo de memberships. Extienden `DomainError` y
 * declaran su `status` HTTP (traducido por `DomainExceptionFilter`).
 */
export class DuplicateMembershipError extends DomainError {
  readonly status = 409;

  constructor(userId: string, organizationId: string) {
    super(`User ${userId} already has a membership in organization ${organizationId}`);
  }
}

export class MembershipNotFoundError extends DomainError {
  readonly status = 404;

  constructor(identifier: string) {
    super(`Membership not found: ${identifier}`);
  }
}

/** No se puede remover/degradar al único OWNER de una organización. */
export class SoleOwnerError extends DomainError {
  readonly status = 409;

  constructor() {
    super('The sole owner of an organization cannot be removed or demoted');
  }
}

/** El rol del usuario no alcanza el mínimo requerido para la operación. */
export class InsufficientRoleError extends DomainError {
  readonly status = 403;

  constructor() {
    super('Your role is not high enough to perform this operation on this member');
  }
}

/** Un miembro no puede cambiar su propio rol (evita auto-promoción). */
export class CannotChangeOwnRoleError extends DomainError {
  readonly status = 409;

  constructor() {
    super('You cannot change your own role');
  }
}
