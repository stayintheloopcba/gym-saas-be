import { DomainError } from '../../../common/errors/domain-error';

export class BranchNotFoundError extends DomainError {
  readonly status = 404;

  constructor(identifier: string) {
    super(`Branch not found: ${identifier}`);
  }
}
