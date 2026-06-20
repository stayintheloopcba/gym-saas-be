import { Injectable, Logger } from '@nestjs/common';

export interface HttpRequestLog {
  event: 'http_request';
  requestId: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  outcome: 'success' | 'error';
  accountId?: string;
  activeOrganizationId?: string;
}

export interface HttpErrorLog {
  event: 'http_error';
  requestId: string;
  method: string;
  path: string;
  statusCode: number;
  errorType: string;
  message: string;
  accountId?: string;
  activeOrganizationId?: string;
}

/**
 * Emits one-line JSON containing only operational metadata. Request payloads,
 * headers, cookies, query strings, passwords, and tokens are never accepted.
 */
@Injectable()
export class StructuredLogger {
  private readonly logger = new Logger('HTTP');

  logRequest(entry: HttpRequestLog): void {
    this.logger.log(JSON.stringify(entry));
  }

  logError(entry: HttpErrorLog, stack?: string): void {
    this.logger.error(JSON.stringify(entry), stack);
  }
}
