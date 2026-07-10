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
