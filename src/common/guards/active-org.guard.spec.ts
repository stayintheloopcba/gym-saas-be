import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthContextService } from '../context/auth-context.service';
import { ActiveOrgGuard } from './active-org.guard';

/**
 * `isPlatformAdmin` no participa en este guard en absoluto (no se lee de
 * ningún lado): una organización activa via `AuthContextService` es la única
 * señal. Estos tests documentan que un platform admin sin membresía es
 * rechazado exactamente igual que cualquier otro no-miembro (design: platform
 * admin does not bypass organization scoping).
 */
describe('ActiveOrgGuard', () => {
  let authContext: { getActiveOrganizationId: jest.Mock };
  let guard: ActiveOrgGuard;

  const executionContext = (params: Record<string, string> = {}): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ params }) }),
    }) as ExecutionContext;

  beforeEach(() => {
    authContext = { getActiveOrganizationId: jest.fn() };
    guard = new ActiveOrgGuard(authContext as unknown as AuthContextService);
  });

  it('rejects when there is no active organization (e.g. a platform admin with no membership)', () => {
    authContext.getActiveOrganizationId.mockReturnValue(undefined);

    expect(() => guard.canActivate(executionContext({ id: 'org-1' }))).toThrow(ForbiddenException);
  });

  it('rejects when the path organization does not match the active organization', () => {
    authContext.getActiveOrganizationId.mockReturnValue('org-1');

    expect(() => guard.canActivate(executionContext({ id: 'org-2' }))).toThrow(ForbiddenException);
  });

  it('allows when the active organization matches the path', () => {
    authContext.getActiveOrganizationId.mockReturnValue('org-1');

    expect(guard.canActivate(executionContext({ id: 'org-1' }))).toBe(true);
  });
});
