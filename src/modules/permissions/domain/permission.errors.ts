import { DomainError } from '../../../common/errors/domain-error';

export class PermissionDeniedError extends DomainError {
  readonly status = 403;

  constructor() {
    super('You do not have the required permissions for this action');
  }
}

/** El código de permiso no existe (o está inactivo) en el catálogo. */
export class UnknownPermissionError extends DomainError {
  readonly status = 400;

  constructor(code: string) {
    super(`Unknown or inactive permission: ${code}`);
  }
}
