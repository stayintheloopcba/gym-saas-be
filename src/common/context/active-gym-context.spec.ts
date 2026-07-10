import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { NextFunction, Request, Response } from 'express';
import { AuthContextMiddleware } from './auth-context.middleware';
import { AuthContext, authContextStorage } from './auth-context.store';
import { MembershipContextPort } from './membership-context.port';

describe('AuthContextMiddleware', () => {
  let jwt: { verify: jest.Mock };
  let membershipContext: jest.Mocked<MembershipContextPort>;
  let middleware: AuthContextMiddleware;
  let setHeader: jest.Mock;

  const config = {
    getOrThrow: () => 'access-secret',
    get: (_key: string, fallback: string) => fallback,
  } as unknown as ConfigService;

  const run = async (cookies: Record<string, string>, incomingRequestId?: string): Promise<AuthContext | undefined> => {
    let captured: AuthContext | undefined;
    const next: NextFunction = () => {
      captured = authContextStorage.getStore();
    };
    const request = {
      cookies,
      get: jest.fn(() => incomingRequestId),
    } as unknown as Request;
    const response = { setHeader } as unknown as Response;

    await middleware.use(request, response, next);
    return captured;
  };

  beforeEach(() => {
    jwt = { verify: jest.fn(() => ({ sub: 'user-1', sessionId: 'session-1' })) };
    membershipContext = { isActiveMember: jest.fn() };
    middleware = new AuthContextMiddleware(jwt as unknown as JwtService, config, membershipContext);
    setHeader = jest.fn();
  });

  it('keeps a safe incoming request id and exposes it in the response', async () => {
    const context = await run({}, 'client-request_123');

    expect(context?.requestId).toBe('client-request_123');
    expect(context?.accountId).toBeUndefined();
    expect(setHeader).toHaveBeenCalledWith('x-request-id', 'client-request_123');
  });

  it('replaces an unsafe request id', async () => {
    const context = await run({}, 'token=secret value');

    expect(context?.requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(context?.requestId).not.toContain('secret');
    expect(setHeader).toHaveBeenCalledWith('x-request-id', context?.requestId);
  });

  it('exposes the active org when the user has an active membership', async () => {
    membershipContext.isActiveMember.mockResolvedValue(true);

    const context = await run({ access_token: 'tok', active_gym: 'gym-1' });

    expect(context?.accountId).toBe('user-1');
    expect(context?.sessionId).toBe('session-1');
    expect(context?.activeGymId).toBe('gym-1');
  });

  it('drops a forged or stale active-gym cookie', async () => {
    membershipContext.isActiveMember.mockResolvedValue(false);

    const context = await run({ access_token: 'tok', active_gym: 'gym-forged' });

    expect(context?.accountId).toBe('user-1');
    expect(context?.activeGymId).toBeUndefined();
  });

  it('keeps request tracing when the access token is invalid', async () => {
    jwt.verify.mockImplementation(() => {
      throw new Error('invalid');
    });

    const context = await run({ access_token: 'secret-token' });

    expect(context?.requestId).toBeDefined();
    expect(context?.accountId).toBeUndefined();
  });
});
