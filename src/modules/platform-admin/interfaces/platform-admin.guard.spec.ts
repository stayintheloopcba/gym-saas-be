import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { FindUserByIdUseCase } from '../../users/application/find-user.use-cases';
import { PlatformAdminGuard } from './platform-admin.guard';

describe('PlatformAdminGuard', () => {
  let findUserById: { execute: jest.Mock };
  let guard: PlatformAdminGuard;

  const executionContext = (user?: object): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    }) as ExecutionContext;

  beforeEach(() => {
    findUserById = { execute: jest.fn() };
    guard = new PlatformAdminGuard(findUserById as unknown as FindUserByIdUseCase);
  });

  it('rejects an unauthenticated request', async () => {
    await expect(guard.canActivate(executionContext())).rejects.toBeInstanceOf(ForbiddenException);
    expect(findUserById.execute).not.toHaveBeenCalled();
  });

  it('rejects a user without the platform-admin flag, even with an organization permission context', async () => {
    findUserById.execute.mockResolvedValue({ id: 'user-1', isPlatformAdmin: false });

    await expect(guard.canActivate(executionContext({ user: { id: 'user-1' } }))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejects when the user no longer exists', async () => {
    findUserById.execute.mockResolvedValue(null);

    await expect(guard.canActivate(executionContext({ user: { id: 'ghost' } }))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('allows a platform admin, reading the flag fresh from the database', async () => {
    findUserById.execute.mockResolvedValue({ id: 'user-1', isPlatformAdmin: true });

    await expect(guard.canActivate(executionContext({ user: { id: 'user-1' } }))).resolves.toBe(true);
    expect(findUserById.execute).toHaveBeenCalledWith('user-1');
  });
});
