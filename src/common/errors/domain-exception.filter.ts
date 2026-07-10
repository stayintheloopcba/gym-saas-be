import { ArgumentsHost, Catch, HttpException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { DomainError } from './domain-error';

/**
 * Traduce cualquier `DomainError` a una `HttpException` con el `status` que la
 * propia subclase declara. Centraliza la traducción dominio → HTTP para los
 * módulos de negocio (gyms, memberships, roles); cualquier otro
 * error se delega al filtro global.
 *
 * (El módulo `auth` usa su propio `DomainExceptionFilter` con `instanceof`
 * porque sus errores son anteriores a esta base `DomainError`.)
 */
@Catch(DomainError)
export class DomainExceptionFilter extends BaseExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost): void {
    super.catch(new HttpException(exception.message, exception.status), host);
  }
}
