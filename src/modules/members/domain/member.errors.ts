import { DomainError } from '../../../common/errors/domain-error';

/** Ya existe un `Member` no eliminado con el mismo `documentId` o `userId` en el gym. */
export class DuplicateMemberError extends DomainError {
  readonly status = 409;

  constructor(reason: 'documentId' | 'userId') {
    super(`A member with the same ${reason} already exists in this gym`);
  }
}

export class MemberNotFoundError extends DomainError {
  readonly status = 404;

  constructor(identifier: string) {
    super(`Member not found: ${identifier}`);
  }
}

/** El member ya tiene una cuenta de acceso vinculada (`userId` no nulo). */
export class MemberAlreadyLinkedError extends DomainError {
  readonly status = 409;

  constructor() {
    super('This member already has a linked account');
  }
}

/** Nadie puede cambiar su propio rol (evita auto-promoción). */
export class CannotChangeOwnRoleError extends DomainError {
  readonly status = 409;

  constructor() {
    super('You cannot change your own role');
  }
}

/** El rol `owner` solo se otorga automáticamente al crear el gym. */
export class OwnerRoleNotAssignableError extends DomainError {
  readonly status = 409;

  constructor() {
    super('The owner role cannot be assigned through this operation');
  }
}

/** No se puede remover/degradar al único `owner` de un gym. */
export class SoleOwnerError extends DomainError {
  readonly status = 409;

  constructor() {
    super('The sole owner of a gym cannot be removed or demoted');
  }
}

/** El `roleId` no corresponde a ningún rol del catálogo. */
export class UnknownRoleError extends DomainError {
  readonly status = 404;

  constructor(roleId: string) {
    super(`Unknown role: ${roleId}`);
  }
}
