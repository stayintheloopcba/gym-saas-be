import { AuthProvider } from '../enums/auth-provider.enum';
import { User } from '../../modules/users/domain/user.entity';
import { DefaultBy } from '../enums/default-by.enum';
import { AuthContextService } from './auth-context.service';
import { authContextStorage } from './auth-context.store';

/**
 * Verifica que el contexto poblado por el middleware (vía `authContextStorage.run`)
 * sea visible tanto para el seam `AuthContextService` como para el hook de
 * auditoría de `BaseAuditEntity` (`createdBy`/`updatedBy`), sin necesidad de DB.
 */
describe('auth context + audit wiring', () => {
  const service = new AuthContextService();

  // `beforeInsert` / `beforeUpdate` son protected: los invocamos por casting.
  const runInsert = (user: User): void => (user as unknown as { beforeInsert(): void }).beforeInsert();
  const runUpdate = (user: User): void => (user as unknown as { beforeUpdate(): void }).beforeUpdate();

  it('exposes the account id through the service inside the context', () => {
    expect(service.getAccountId()).toBeUndefined();

    authContextStorage.run({ requestId: 'request-1', accountId: 'user-123', sessionId: 'session-123' }, () => {
      expect(service.getRequestId()).toBe('request-1');
      expect(service.getAccountId()).toBe('user-123');
      expect(service.getSessionId()).toBe('session-123');
    });
  });

  it('stamps createdBy with the authenticated account id on insert', () => {
    authContextStorage.run({ requestId: 'request-2', accountId: 'user-123' }, () => {
      const user = Object.assign(new User(), { provider: AuthProvider.LOCAL });
      runInsert(user);
      expect(user.createdBy).toBe('user-123');
    });
  });

  it('stamps updatedBy with the authenticated account id on update', () => {
    authContextStorage.run({ requestId: 'request-3', accountId: 'user-456' }, () => {
      const user = Object.assign(new User(), { provider: AuthProvider.LOCAL });
      runUpdate(user);
      expect(user.updatedBy).toBe('user-456');
    });
  });

  it('falls back to UNKNOWN when there is no auth context', () => {
    const user = Object.assign(new User(), { provider: AuthProvider.LOCAL });
    runInsert(user);
    expect(user.createdBy).toBe(DefaultBy.UNKNOWN);
  });
});
