/**
 * Error de dominio de negocio (puro, sin dependencia de HTTP/NestJS).
 *
 * Cada subclase declara el `status` HTTP con el que la capa de interfaces lo
 * traduce. `DomainExceptionFilter` (en `common/errors`) hace esa traducción de
 * forma centralizada, así el dominio nunca importa NestJS.
 */
export abstract class DomainError extends Error {
  abstract readonly status: number;

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
