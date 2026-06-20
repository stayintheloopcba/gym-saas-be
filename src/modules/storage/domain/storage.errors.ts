import { DomainError } from '../../../common/errors/domain-error';

/**
 * Errores de dominio del módulo de storage. Extienden `DomainError` y declaran su
 * `status` HTTP; `DomainExceptionFilter` los traduce sin acoplar el dominio a NestJS.
 */
export class InvalidFileTypeError extends DomainError {
  readonly status = 400;

  constructor(received: string, allowed: readonly string[]) {
    super(`Unsupported file type "${received}". Allowed types: ${allowed.join(', ')}`);
  }
}

export class FileTooLargeError extends DomainError {
  readonly status = 413;

  constructor(sizeBytes: number, maxBytes: number) {
    super(`File too large (${sizeBytes} bytes). Maximum allowed: ${maxBytes} bytes`);
  }
}

/** No se recibió ningún archivo en la subida. */
export class MissingFileError extends DomainError {
  readonly status = 400;

  constructor() {
    super('No file was provided in the upload');
  }
}
