import { BadRequestException, CallHandler, ExecutionContext } from '@nestjs/common';
import type { Request, Response } from 'express';
import { lastValueFrom, of, throwError } from 'rxjs';
import { authContextStorage } from '../context/auth-context.store';
import { HttpLoggingInterceptor } from './http-logging.interceptor';
import { StructuredLogger } from './structured-logger.service';

describe('HttpLoggingInterceptor', () => {
  let logRequest: jest.Mock;
  let interceptor: HttpLoggingInterceptor;
  let context: ExecutionContext;

  beforeEach(() => {
    logRequest = jest.fn();
    interceptor = new HttpLoggingInterceptor({ logRequest } as unknown as StructuredLogger);

    const request = {
      method: 'POST',
      path: '',
      originalUrl: '/auth/login?token=must-not-leak',
      url: '/auth/login?token=must-not-leak',
      body: { password: 'must-not-leak' },
      cookies: { access_token: 'must-not-leak' },
      headers: { authorization: 'must-not-leak' },
    } as unknown as Request;
    const response = { statusCode: 201 } as Response;
    context = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as unknown as ExecutionContext;
  });

  it('logs safe metadata for a successful request', async () => {
    const next = { handle: () => of({ ok: true }) } as CallHandler;

    await authContextStorage.run(
      {
        requestId: 'request-1',
        accountId: 'user-1',
        activeOrganizationId: 'org-1',
      },
      () => lastValueFrom(interceptor.intercept(context, next)),
    );

    expect(logRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'http_request',
        requestId: 'request-1',
        method: 'POST',
        path: '/auth/login',
        statusCode: 201,
        outcome: 'success',
        accountId: 'user-1',
        activeOrganizationId: 'org-1',
      }),
    );
    expect(JSON.stringify(logRequest.mock.calls[0][0])).not.toContain('must-not-leak');
  });

  it('logs the exception status without swallowing the error', async () => {
    const error = new BadRequestException('invalid');
    const next = { handle: () => throwError(() => error) } as CallHandler;

    await expect(
      authContextStorage.run({ requestId: 'request-2' }, () => lastValueFrom(interceptor.intercept(context, next))),
    ).rejects.toBe(error);

    expect(logRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'request-2',
        statusCode: 400,
        outcome: 'error',
      }),
    );
  });
});
