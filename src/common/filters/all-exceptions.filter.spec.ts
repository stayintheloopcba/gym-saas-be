import { ArgumentsHost, BadRequestException, HttpStatus, NotFoundException } from '@nestjs/common';
import { EntityNotFoundError, QueryFailedError } from 'typeorm';
import { authContextStorage } from '../context/auth-context.store';
import { StructuredLogger } from '../logging/structured-logger.service';
import { AllExceptionsFilter, ErrorResponseBody } from './all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let json: jest.Mock;
  let status: jest.Mock;
  let logError: jest.Mock;
  let host: ArgumentsHost;

  beforeEach(() => {
    logError = jest.fn();
    filter = new AllExceptionsFilter({ logError } as unknown as StructuredLogger);
    json = jest.fn();
    status = jest.fn(() => ({ json }));
    host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({
          url: '/test?token=must-not-leak',
          originalUrl: '/test?token=must-not-leak',
          path: '/test',
          method: 'GET',
        }),
      }),
    } as unknown as ArgumentsHost;
  });

  const captureBody = (): ErrorResponseBody => json.mock.calls[0][0] as ErrorResponseBody;

  it('maps a validation BadRequestException keeping the messages array', () => {
    authContextStorage.run({ requestId: 'request-1' }, () =>
      filter.catch(new BadRequestException(['name must be a string']), host),
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    const body = captureBody();
    expect(body.requestId).toBe('request-1');
    expect(body.error).toBe('Bad Request');
    expect(body.message).toEqual(['name must be a string']);
    expect(body.path).toBe('/test');
    expect(typeof body.timestamp).toBe('string');
  });

  it('maps an HttpException with a string response', () => {
    const exception = new NotFoundException();
    // Forzamos una respuesta string (no el objeto por defecto).
    jest.spyOn(exception, 'getResponse').mockReturnValue('plain message');

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(captureBody().message).toBe('plain message');
  });

  it('maps a TypeORM EntityNotFoundError to 404', () => {
    filter.catch(new EntityNotFoundError('User', {}), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(captureBody().error).toBe('Not Found');
  });

  it('maps a TypeORM QueryFailedError (generic) to 500', () => {
    authContextStorage.run({ requestId: 'request-500', accountId: 'user-1', activeGymId: 'gym-1' }, () =>
      filter.catch(new QueryFailedError('SELECT 1', [], new Error('boom')), host),
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(captureBody().error).toBe('Internal Server Error');
    expect(logError).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'http_error',
        requestId: 'request-500',
        path: '/test',
        statusCode: 500,
        accountId: 'user-1',
        activeGymId: 'gym-1',
      }),
      expect.any(String),
    );
    expect(JSON.stringify(logError.mock.calls[0][0])).not.toContain('must-not-leak');
  });

  it('maps a TypeORM QueryFailedError with pg code 23505 to 409', () => {
    const driverError = Object.assign(new Error('unique violation'), { code: '23505' });
    const uniqueViolation = new QueryFailedError('INSERT INTO users', [], driverError);
    filter.catch(uniqueViolation, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(captureBody().error).toBe('Conflict');
  });

  it('maps an unknown error to 500', () => {
    filter.catch(new Error('unexpected'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(captureBody().message).toBe('Internal server error');
  });
});
