import { DomainError } from '../../../common/errors/domain-error';

export class RoutineNotFoundError extends DomainError {
  readonly status = 404;

  constructor(identifier: string) {
    super(`Routine not found: ${identifier}`);
  }
}

/** `PERSONAL` requiere `ownerMemberId`. */
export class RoutineOwnerRequiredError extends DomainError {
  readonly status = 409;

  constructor() {
    super('A personal routine requires an ownerMemberId');
  }
}

/** `TEMPLATE` no admite `ownerMemberId`. */
export class RoutineOwnerNotAllowedError extends DomainError {
  readonly status = 409;

  constructor() {
    super('A template routine cannot have an ownerMemberId');
  }
}

/** Un member con rol `student` solo puede crear/editar rutinas personales propias. */
export class RoutineOwnerMismatchError extends DomainError {
  readonly status = 409;

  constructor() {
    super('Students can only own their own personal routines');
  }
}
