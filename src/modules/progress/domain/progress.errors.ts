import { DomainError } from '../../../common/errors/domain-error';

/** Un member con rol `student` solo puede registrar/leer su propio progreso. */
export class ProgressOwnerMismatchError extends DomainError {
  readonly status = 409;

  constructor() {
    super('Students can only record or read their own progress');
  }
}
