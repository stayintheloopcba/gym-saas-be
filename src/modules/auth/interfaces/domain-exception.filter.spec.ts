import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import type { ErrorResponseBody } from '../../../common/filters/all-exceptions.filter';
import { DuplicateEmailError, UserNotFoundError } from '../../users/domain/user.errors';
import { DomainExceptionFilter } from './domain-exception.filter';

describe('DomainExceptionFilter', () => {
  let filter: DomainExceptionFilter;
  let json: jest.Mock;
  let status: jest.Mock;
  let host: ArgumentsHost;

  beforeEach(() => {
    filter = new DomainExceptionFilter();
    json = jest.fn();
    status = jest.fn(() => ({ json }));
    host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({ url: '/auth/register', method: 'POST' }),
      }),
    } as unknown as ArgumentsHost;
  });

  const captureBody = (): ErrorResponseBody => json.mock.calls[0][0] as ErrorResponseBody;

  it('maps DuplicateEmailError to 409 with the domain message', () => {
    filter.catch(new DuplicateEmailError('test@example.com'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    const body = captureBody();
    expect(body.error).toBe('Conflict');
    expect(body.message).toContain('test@example.com');
    expect(body.path).toBe('/auth/register');
    expect(typeof body.timestamp).toBe('string');
  });

  it('maps UserNotFoundError to 404 with the domain message', () => {
    filter.catch(new UserNotFoundError('abc-123'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    const body = captureBody();
    expect(body.error).toBe('Not Found');
    expect(body.message).toContain('abc-123');
    expect(body.path).toBe('/auth/register');
    expect(typeof body.timestamp).toBe('string');
  });
});
