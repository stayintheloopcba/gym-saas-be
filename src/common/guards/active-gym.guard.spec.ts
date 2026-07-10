import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthContextService } from '../context/auth-context.service';
import { ActiveGymGuard } from './active-gym.guard';

/**
 * `isPlatformAdmin` no participa en este guard en absoluto (no se lee de
 * ningún lado): una organización activa via `AuthContextService` es la única
 * señal. Estos tests documentan que un platform admin sin membresía es
 * rechazado exactamente igual que cualquier otro no-miembro (design: platform
 * admin does not bypass gym scoping).
 */
describe('ActiveGymGuard', () => {
  let authContext: { getActiveGymId: jest.Mock };
  let guard: ActiveGymGuard;

  const executionContext = (params: Record<string, string> = {}): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ params }) }),
    }) as ExecutionContext;

  beforeEach(() => {
    authContext = { getActiveGymId: jest.fn() };
    guard = new ActiveGymGuard(authContext as unknown as AuthContextService);
  });

  it('rejects when there is no active gym (e.g. a platform admin with no membership)', () => {
    authContext.getActiveGymId.mockReturnValue(undefined);

    expect(() => guard.canActivate(executionContext({ id: 'gym-1' }))).toThrow(ForbiddenException);
  });

  it('rejects when the path gym does not match the active gym', () => {
    authContext.getActiveGymId.mockReturnValue('gym-1');

    expect(() => guard.canActivate(executionContext({ id: 'gym-2' }))).toThrow(ForbiddenException);
  });

  it('allows when the active gym matches the path', () => {
    authContext.getActiveGymId.mockReturnValue('gym-1');

    expect(guard.canActivate(executionContext({ id: 'gym-1' }))).toBe(true);
  });
});
