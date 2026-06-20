import { DomainError } from '../../../common/errors/domain-error';

export class RoleNotFoundError extends DomainError {
  readonly status = 404;

  constructor(identifier: string) {
    super(`Role not found: ${identifier}`);
  }
}

/** Ya existe un rol activo con ese nombre en la organización. */
export class RoleNameConflictError extends DomainError {
  readonly status = 409;

  constructor(name: string) {
    super(`A role named "${name}" already exists in this organization`);
  }
}

/** Los roles de sistema no se pueden editar ni eliminar. */
export class SystemRoleImmutableError extends DomainError {
  readonly status = 409;

  constructor() {
    super('System roles cannot be modified or deleted');
  }
}

/** No se puede eliminar un rol que tiene miembros asignados. */
export class RoleInUseError extends DomainError {
  readonly status = 409;

  constructor() {
    super('This role is in use by one or more members and cannot be deleted');
  }
}

/** No se puede crear/asignar un rol por encima del nivel de jerarquía propio. */
export class RoleHierarchyExceededError extends DomainError {
  readonly status = 403;

  constructor() {
    super('You cannot manage a role with a hierarchy level above your own');
  }
}
