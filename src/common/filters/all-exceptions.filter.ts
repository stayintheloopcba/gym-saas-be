import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { EntityNotFoundError, QueryFailedError } from 'typeorm';
import { authContextStorage } from '../context/auth-context.store';
import { StructuredLogger } from '../logging/structured-logger.service';

/** Forma uniforme de toda respuesta de error de la API. */
export interface ErrorResponseBody {
  requestId: string;
  statusCode: number;
  error: string;
  message: string | string[];
  timestamp: string;
  path: string;
}

interface ResolvedError {
  statusCode: number;
  error: string;
  message: string | string[];
}

/**
 * Filtro global que captura cualquier excepción y devuelve un envelope de error
 * consistente. Mapea las excepciones de TypeORM a códigos HTTP adecuados y
 * loguea solo los errores 5xx (los 4xx son esperables del cliente).
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger = new StructuredLogger()) {}

  public catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestContext = authContextStorage.getStore();
    const requestId = requestContext?.requestId ?? 'unknown';

    const { statusCode, error, message } = this.resolve(exception);

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.logError(
        {
          event: 'http_error',
          requestId,
          method: request.method,
          path: this.pathWithoutQuery(request),
          statusCode,
          errorType: exception instanceof Error ? exception.name : 'UnknownError',
          message: this.stringify(message),
          accountId: requestContext?.accountId,
          activeGymId: requestContext?.activeGymId,
        },
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const body: ErrorResponseBody = {
      requestId,
      statusCode,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: this.pathWithoutQuery(request),
    };

    response.status(statusCode).json(body);
  }

  private resolve(exception: unknown): ResolvedError {
    if (exception instanceof HttpException) {
      return this.fromHttpException(exception);
    }

    if (exception instanceof EntityNotFoundError) {
      return { statusCode: HttpStatus.NOT_FOUND, error: 'Not Found', message: 'Resource not found' };
    }

    if (exception instanceof QueryFailedError) {
      const pg = (exception as QueryFailedError & { driverError?: { code?: string } }).driverError;
      if (pg?.code === '23505') {
        return { statusCode: HttpStatus.CONFLICT, error: 'Conflict', message: 'Resource already exists' };
      }
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Internal Server Error',
        message: 'Internal server error',
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'Internal server error',
    };
  }

  private fromHttpException(exception: HttpException): ResolvedError {
    const statusCode = exception.getStatus();
    const res = exception.getResponse();

    // class-validator devuelve { statusCode, error, message: string[] }
    if (typeof res === 'object') {
      const payload = res as { message?: string | string[]; error?: string };
      return {
        statusCode,
        error: payload.error ?? exception.name,
        message: payload.message ?? exception.message,
      };
    }

    return { statusCode, error: exception.name, message: res };
  }

  private stringify(message: string | string[]): string {
    return Array.isArray(message) ? message.join(', ') : message;
  }

  private pathWithoutQuery(request: Request): string {
    return request.path || request.originalUrl?.split('?')[0] || request.url.split('?')[0];
  }
}
