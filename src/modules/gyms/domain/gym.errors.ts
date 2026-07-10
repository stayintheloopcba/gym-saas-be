import { DomainError } from '../../../common/errors/domain-error';

/**
 * Errores de dominio del módulo de organizaciones.
 *
 * Extienden `DomainError` y declaran su `status` HTTP; `DomainExceptionFilter`
 * (en `common/errors`) los traduce sin que el dominio conozca NestJS.
 */
export class GymNotFoundError extends DomainError {
  readonly status = 404;

  constructor(identifier: string) {
    super(`Gym not found: ${identifier}`);
  }
}

export class SlugTakenError extends DomainError {
  readonly status = 409;

  constructor(slug: string) {
    super(`The slug "${slug}" is already taken`);
  }
}
