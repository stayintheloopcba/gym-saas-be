import { DomainError } from '../../../common/errors/domain-error';

/**
 * Errores de dominio del módulo de invitaciones. Extienden `DomainError` y
 * declaran su `status` HTTP (traducido por `DomainExceptionFilter`).
 */
export class InvitationNotFoundError extends DomainError {
  readonly status = 404;

  constructor() {
    super('Invitation not found');
  }
}

/** La invitación ya fue aceptada, revocada o expirada: no es aceptable. */
export class InvitationNotPendingError extends DomainError {
  readonly status = 409;

  constructor() {
    super('Invitation is no longer pending');
  }
}

export class InvitationExpiredError extends DomainError {
  readonly status = 410;

  constructor() {
    super('Invitation has expired');
  }
}

/** El email del usuario autenticado no coincide con el de la invitación. */
export class InvitationEmailMismatchError extends DomainError {
  readonly status = 403;

  constructor() {
    super('This invitation was addressed to a different email');
  }
}

/** El email invitado ya tiene una membresía activa en la organización. */
export class AlreadyMemberError extends DomainError {
  readonly status = 409;

  constructor() {
    super('This user is already a member of the organization');
  }
}
