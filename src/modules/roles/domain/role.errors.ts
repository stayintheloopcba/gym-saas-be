import { DomainError } from '../../../common/errors/domain-error';

export class RoleNotFoundError extends DomainError {
  readonly status = 404;

  constructor(identifier: string) {
    super(`Role not found: ${identifier}`);
  }
}

/** Ya existe un rol activo con esa `key` en el catálogo. */
export class RoleKeyConflictError extends DomainError {
  readonly status = 409;

  constructor(key: string) {
    super(`A role with key "${key}" already exists`);
  }
}

/** No se puede eliminar un rol referenciado por una membresía activa. */
export class RoleInUseError extends DomainError {
  readonly status = 409;

  constructor() {
    super('This role is in use by one or more members and cannot be deleted');
  }
}

/** El rol `owner` no se puede eliminar ni asignar a través de estas operaciones. */
export class OwnerRoleProtectedError extends DomainError {
  readonly status = 409;

  constructor() {
    super('The owner role cannot be deleted or assigned through this operation');
  }
}
