import { CallHandler, ExecutionContext, HttpException, Injectable, NestInterceptor } from '@nestjs/common';
import type { Request, Response } from 'express';
import { catchError, finalize, Observable, throwError } from 'rxjs';
import { authContextStorage } from '../context/auth-context.store';
import { StructuredLogger } from './structured-logger.service';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: StructuredLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const startedAt = Date.now();
    let statusCode = response.statusCode;
    let outcome: 'success' | 'error' = 'success';

    return next.handle().pipe(
      catchError((error: unknown) => {
        statusCode = error instanceof HttpException ? error.getStatus() : 500;
        outcome = 'error';
        return throwError(() => error);
      }),
      finalize(() => this.log(request, statusCode, startedAt, outcome)),
    );
  }

  private log(request: Request, statusCode: number, startedAt: number, outcome: 'success' | 'error'): void {
    const requestContext = authContextStorage.getStore();
    this.logger.logRequest({
      event: 'http_request',
      requestId: requestContext?.requestId ?? 'unknown',
      method: request.method,
      path: this.pathWithoutQuery(request),
      statusCode,
      durationMs: Math.max(0, Date.now() - startedAt),
      outcome,
      accountId: requestContext?.accountId,
      activeGymId: requestContext?.activeGymId,
    });
  }

  private pathWithoutQuery(request: Request): string {
    return request.path || request.originalUrl?.split('?')[0] || request.url.split('?')[0];
  }
}
