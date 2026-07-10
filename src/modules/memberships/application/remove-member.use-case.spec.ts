import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PermissionDeniedError } from '../../permissions/domain/permission.errors';
import { PermissionRepository } from '../../permissions/domain/permission.repository';
import { RoleSummary } from '../../permissions/domain/role-summary';
import { Membership } from '../domain/membership.entity';
import { SoleOwnerError } from '../domain/membership.errors';
import { MembershipRepository } from '../domain/membership.repository';
import { RemoveMemberUseCase } from './remove-member.use-case';

const GYM = 'gym-1';
const OWNER: RoleSummary = { id: 'role-owner', key: 'owner', name: 'Dueño' };
const ADMIN: RoleSummary = { id: 'role-admin', key: 'admin', name: 'Administrador' };
const ROLES: Record<string, RoleSummary> = { [OWNER.id]: OWNER, [ADMIN.id]: ADMIN };

const membership = (userId: string, roleId: string): Membership =>
  Object.assign(new Membership(), { id: `m-${userId}`, userId, gymId: GYM, roleId });

describe('RemoveMemberUseCase', () => {
  let memberships: jest.Mocked<MembershipRepository>;
  let permissionsRepo: { findRoleSummary: jest.Mock };
  let permissions: { requirePermission: jest.Mock };
  let useCase: RemoveMemberUseCase;

  beforeEach(() => {
    memberships = {
      findByUserAndOrg: jest.fn(),
      findByUser: jest.fn(),
      findByOrg: jest.fn(),
      countByRoleInOrg: jest.fn(),
      countByRole: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    };
    permissionsRepo = { findRoleSummary: jest.fn((roleId: string) => Promise.resolve(ROLES[roleId] ?? null)) };
    permissions = { requirePermission: jest.fn() };
    useCase = new RemoveMemberUseCase(
      memberships,
      permissionsRepo as unknown as PermissionRepository,
      permissions as unknown as GymPermissionService,
    );
  });

  it('lets an admin remove a regular member', async () => {
    memberships.findByUserAndOrg.mockImplementation((userId) =>
      Promise.resolve(userId === 'admin' ? membership('admin', ADMIN.id) : membership('bob', ADMIN.id)),
    );

    await useCase.execute({ callerUserId: 'admin', gymId: GYM, targetUserId: 'bob' });

    expect(memberships.softDelete).toHaveBeenCalledWith('m-bob');
  });

  it('rejects removing the sole owner', async () => {
    memberships.findByUserAndOrg.mockResolvedValue(membership('owner', OWNER.id));
    memberships.countByRoleInOrg.mockResolvedValue(1);

    await expect(useCase.execute({ callerUserId: 'owner', gymId: GYM, targetUserId: 'owner' })).rejects.toBeInstanceOf(
      SoleOwnerError,
    );
    expect(memberships.softDelete).not.toHaveBeenCalled();
  });

  it('allows removing an owner when another owner remains', async () => {
    memberships.findByUserAndOrg.mockResolvedValue(membership('owner', OWNER.id));
    memberships.countByRoleInOrg.mockResolvedValue(2);

    await useCase.execute({ callerUserId: 'other-owner', gymId: GYM, targetUserId: 'owner' });

    expect(memberships.softDelete).toHaveBeenCalledWith('m-owner');
  });

  it('rejects a member without privilege', async () => {
    permissions.requirePermission.mockRejectedValue(new PermissionDeniedError());

    await expect(useCase.execute({ callerUserId: 'member', gymId: GYM, targetUserId: 'bob' })).rejects.toBeInstanceOf(
      PermissionDeniedError,
    );
    expect(memberships.softDelete).not.toHaveBeenCalled();
  });
});
