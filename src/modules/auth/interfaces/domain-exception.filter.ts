import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { authContextStorage } from '../../../common/context/auth-context.store';
import type { ErrorResponseBody } from '../../../common/filters/all-exceptions.filter';
import { DuplicateEmailError, UserNotFoundError } from '../../users/domain/user.errors';

/**
 * Traduce errores de dominio (puros, sin dependencia de HTTP) a respuestas HTTP
 * con el mismo envelope que `AllExceptionsFilter`. Registrado globalmente vía
 * `APP_FILTER` en `AuthModule` para que cubra cualquier módulo que lance estos
 * errores, no solo `AuthController`.
 */
@Catch(DuplicateEmailError, UserNotFoundError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DuplicateEmailError | UserNotFoundError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { statusCode, error } = this.resolve(exception);

    const body: ErrorResponseBody = {
      requestId: authContextStorage.getStore()?.requestId ?? 'unknown',
      statusCode,
      error,
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.path || request.originalUrl?.split('?')[0] || request.url.split('?')[0],
    };

    response.status(statusCode).json(body);
  }

  private resolve(exception: Error): { statusCode: number; error: string } {
    if (exception instanceof DuplicateEmailError) {
      return { statusCode: HttpStatus.CONFLICT, error: 'Conflict' };
    }
    return { statusCode: HttpStatus.NOT_FOUND, error: 'Not Found' };
  }
}
