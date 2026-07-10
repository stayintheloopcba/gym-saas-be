import { ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthContextService } from '../context/auth-context.service';
import { GymPermissionService } from '../../modules/permissions/application/gym-permission.service';
import { OwnershipContextService } from '../../modules/permissions/application/ownership-context.service';
import { PERMISSIONS } from '../../modules/permissions/domain/permission-key';
import { OwnershipValidatorRegistry } from '../../modules/permissions/ownership/ownership-validator-registry';
import { PermissionGuard } from './permission.guard';

describe('PermissionGuard', () => {
  const reflector = { getAllAndOverride: jest.fn() };
  const authContext = { getActiveGymId: jest.fn() };
  const permissions = { checkPermission: jest.fn() };
  const ownershipContext = { build: jest.fn() };
  const validator = { resourceType: 'resource', validate: jest.fn() };
  const registry = { get: jest.fn() };
  let guard: PermissionGuard;

  const executionContext = (user?: object, params: Record<string, string> = {}): ExecutionContext =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user, params }),
      }),
    }) as ExecutionContext;

  const ownershipOptions = {
    permission: PERMISSIONS.SETTINGS_UPDATE,
    resource: 'resource',
    resourceId: (req: { params: Record<string, string> }) => req.params.resourceId,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new PermissionGuard(
      reflector as unknown as Reflector,
      authContext as unknown as AuthContextService,
      permissions as unknown as GymPermissionService,
      ownershipContext as unknown as OwnershipContextService,
      registry as unknown as OwnershipValidatorRegistry,
    );
  });

  it('allows access when no permission metadata is present', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    await expect(guard.canActivate(executionContext())).resolves.toBe(true);
  });

  it('rejects an unauthenticated request', async () => {
    reflector.getAllAndOverride.mockReturnValue({ permission: PERMISSIONS.MEMBERS_READ });
    authContext.getActiveGymId.mockReturnValue('gym-1');

    await expect(guard.canActivate(executionContext())).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows a granted permission without ownership options', async () => {
    reflector.getAllAndOverride.mockReturnValue({ permission: PERMISSIONS.MEMBERS_READ });
    permissions.checkPermission.mockResolvedValue(true);
    const user = { user: { id: 'user-1' }, sessionId: 'session-1' };

    await expect(guard.canActivate(executionContext(user, { id: 'gym-1' }))).resolves.toBe(true);
    expect(registry.get).not.toHaveBeenCalled();
  });

  it('rejects missing permission before evaluating ownership', async () => {
    reflector.getAllAndOverride.mockReturnValue(ownershipOptions);
    authContext.getActiveGymId.mockReturnValue('gym-1');
    permissions.checkPermission.mockResolvedValue(false);
    const user = { user: { id: 'user-1' }, sessionId: 'session-1' };

    await expect(guard.canActivate(executionContext(user, { resourceId: 'res-1' }))).rejects.toThrow(
      'Insufficient permissions',
    );
    expect(registry.get).not.toHaveBeenCalled();
  });

  it('returns 403 when the permission passes but ownership fails', async () => {
    reflector.getAllAndOverride.mockReturnValue(ownershipOptions);
    authContext.getActiveGymId.mockReturnValue('gym-1');
    permissions.checkPermission.mockResolvedValue(true);
    ownershipContext.build.mockResolvedValue({ userId: 'user-1', gymId: 'gym-1', hierarchyLevel: 1 });
    registry.get.mockReturnValue(validator);
    validator.validate.mockResolvedValue({ found: true, owned: false });
    const user = { user: { id: 'user-1' }, sessionId: 'session-1' };

    await expect(guard.canActivate(executionContext(user, { resourceId: 'res-1' }))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('returns 404 when the resource does not exist', async () => {
    reflector.getAllAndOverride.mockReturnValue(ownershipOptions);
    authContext.getActiveGymId.mockReturnValue('gym-1');
    permissions.checkPermission.mockResolvedValue(true);
    ownershipContext.build.mockResolvedValue({ userId: 'user-1', gymId: 'gym-1', hierarchyLevel: 1 });
    registry.get.mockReturnValue(validator);
    validator.validate.mockResolvedValue({ found: false, owned: false });
    const user = { user: { id: 'user-1' }, sessionId: 'session-1' };

    await expect(guard.canActivate(executionContext(user, { resourceId: 'res-1' }))).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('allows access when permission and ownership both pass', async () => {
    reflector.getAllAndOverride.mockReturnValue(ownershipOptions);
    authContext.getActiveGymId.mockReturnValue('gym-1');
    permissions.checkPermission.mockResolvedValue(true);
    ownershipContext.build.mockResolvedValue({ userId: 'user-1', gymId: 'gym-1', hierarchyLevel: 5 });
    registry.get.mockReturnValue(validator);
    validator.validate.mockResolvedValue({ found: true, owned: true });
    const user = { user: { id: 'user-1' }, sessionId: 'session-1' };

    await expect(guard.canActivate(executionContext(user, { resourceId: 'res-1' }))).resolves.toBe(true);
  });

  it('skips ownership when skipOwnership is set', async () => {
    reflector.getAllAndOverride.mockReturnValue({ ...ownershipOptions, skipOwnership: true });
    authContext.getActiveGymId.mockReturnValue('gym-1');
    permissions.checkPermission.mockResolvedValue(true);
    const user = { user: { id: 'user-1' }, sessionId: 'session-1' };

    await expect(guard.canActivate(executionContext(user, { resourceId: 'res-1' }))).resolves.toBe(true);
    expect(registry.get).not.toHaveBeenCalled();
  });
});
