import { DomainError } from '../../../common/errors/domain-error';

export class DisciplineNotFoundError extends DomainError {
  readonly status = 404;

  constructor(identifier: string) {
    super(`Discipline not found: ${identifier}`);
  }
}
