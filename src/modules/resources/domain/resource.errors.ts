import { DomainError } from '../../../common/errors/domain-error';

export class ResourceNotFoundError extends DomainError {
  readonly status = 404;

  constructor(id: string) {
    super(`Resource not found: ${id}`);
  }
}
