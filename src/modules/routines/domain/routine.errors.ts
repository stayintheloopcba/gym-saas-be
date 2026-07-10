import { DomainError } from '../../../common/errors/domain-error';

export class RoutineNotFoundError extends DomainError {
  readonly status = 404;

  constructor(identifier: string) {
    super(`Routine not found: ${identifier}`);
  }
}

export class RoutineItemNotFoundError extends DomainError {
  readonly status = 404;

  constructor(identifier: string) {
    super(`Routine item not found: ${identifier}`);
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

export class RoutineAssignmentNotFoundError extends DomainError {
  readonly status = 404;

  constructor(identifier: string) {
    super(`Routine assignment not found: ${identifier}`);
  }
}

/** Ese member ya tiene esa rutina activamente asignada (UC-6: nunca dos veces a la vez). */
export class DuplicateActiveAssignmentError extends DomainError {
  readonly status = 409;

  constructor() {
    super('This member already has this routine actively assigned');
  }
}

/** Un member con rol `student` solo puede asignarse/desasignarse rutinas a sí mismo. */
export class RoutineAssignmentOwnerMismatchError extends DomainError {
  readonly status = 409;

  constructor() {
    super('Students can only assign or unassign routines to themselves');
  }
}
