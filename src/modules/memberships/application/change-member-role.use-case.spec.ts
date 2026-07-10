import { AuthProvider } from '../../../common/enums/auth-provider.enum';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PermissionDeniedError } from '../../permissions/domain/permission.errors';
import { PermissionRepository } from '../../permissions/domain/permission.repository';
import { RoleSummary } from '../../permissions/domain/role-summary';
import { FindUserByIdUseCase } from '../../users/application/find-user.use-cases';
import { User } from '../../users/domain/user.entity';
import { Membership } from '../domain/membership.entity';
import {
  CannotChangeOwnRoleError,
  MembershipNotFoundError,
  OwnerRoleNotAssignableError,
  SoleOwnerError,
  UnknownRoleError,
} from '../domain/membership.errors';
import { MembershipRepository } from '../domain/membership.repository';
import { ChangeMemberRoleUseCase } from './change-member-role.use-case';

const GYM = 'gym-1';

const OWNER: RoleSummary = { id: 'role-owner', key: 'owner', name: 'Dueño' };
const ADMIN: RoleSummary = { id: 'role-admin', key: 'admin', name: 'Administrador' };
const INSTRUCTOR: RoleSummary = { id: 'role-instructor', key: 'instructor', name: 'Instructor' };
const ROLES: Record<string, RoleSummary> = { [OWNER.id]: OWNER, [ADMIN.id]: ADMIN, [INSTRUCTOR.id]: INSTRUCTOR };

const membership = (userId: string, roleId: string): Membership =>
  Object.assign(new Membership(), { id: `m-${userId}`, userId, gymId: GYM, roleId });

const user = (id: string): User =>
  Object.assign(new User(), {
    id,
    email: `${id}@example.com`,
    name: id,
    provider: AuthProvider.LOCAL,
    createdAt: new Date('2026-01-01T00:00:00Z'),
  });

describe('ChangeMemberRoleUseCase', () => {
  let memberships: jest.Mocked<MembershipRepository>;
  let permissionsRepo: { findRoleSummary: jest.Mock };
  let permissions: { requirePermission: jest.Mock };
  let findUserById: { execute: jest.Mock };
  let useCase: ChangeMemberRoleUseCase;

  const members: Record<string, Membership> = {};

  beforeEach(() => {
    memberships = {
      findByUserAndOrg: jest.fn((userId: string) => Promise.resolve(members[userId] ?? null)),
      findByUser: jest.fn(),
      findByOrg: jest.fn(),
      countByRoleInOrg: jest.fn(),
      countByRole: jest.fn(),
      save: jest.fn((m: Membership) => Promise.resolve(m)),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<MembershipRepository>;
    permissionsRepo = { findRoleSummary: jest.fn((roleId: string) => Promise.resolve(ROLES[roleId] ?? null)) };
    permissions = { requirePermission: jest.fn() };
    findUserById = { execute: jest.fn((id: string) => Promise.resolve(user(id))) };
    useCase = new ChangeMemberRoleUseCase(
      memberships,
      permissionsRepo as unknown as PermissionRepository,
      permissions as unknown as GymPermissionService,
      findUserById as unknown as FindUserByIdUseCase,
    );
    for (const key of Object.keys(members)) {
      delete members[key];
    }
  });

  it('lets a privileged caller change a member to admin', async () => {
    members.owner = membership('owner', OWNER.id);
    members.bob = membership('bob', INSTRUCTOR.id);

    const result = await useCase.execute({
      callerUserId: 'owner',
      gymId: GYM,
      targetUserId: 'bob',
      roleId: ADMIN.id,
    });

    expect(memberships.save).toHaveBeenCalledWith(expect.objectContaining({ id: 'm-bob', roleId: ADMIN.id }));
    expect(result.role).toEqual(ADMIN);
  });

  it('rejects changing your own role', async () => {
    members.admin = membership('admin', ADMIN.id);

    await expect(
      useCase.execute({ callerUserId: 'admin', gymId: GYM, targetUserId: 'admin', roleId: INSTRUCTOR.id }),
    ).rejects.toBeInstanceOf(CannotChangeOwnRoleError);
    expect(memberships.save).not.toHaveBeenCalled();
  });

  it('rejects an unknown roleId', async () => {
    members.admin = membership('admin', ADMIN.id);

    await expect(
      useCase.execute({ callerUserId: 'admin', gymId: GYM, targetUserId: 'bob', roleId: 'ghost-role' }),
    ).rejects.toBeInstanceOf(UnknownRoleError);
    expect(memberships.save).not.toHaveBeenCalled();
  });

  it('rejects assigning the owner role', async () => {
    members.admin = membership('admin', ADMIN.id);

    await expect(
      useCase.execute({ callerUserId: 'admin', gymId: GYM, targetUserId: 'bob', roleId: OWNER.id }),
    ).rejects.toBeInstanceOf(OwnerRoleNotAssignableError);
    expect(memberships.save).not.toHaveBeenCalled();
  });

  it('rejects demoting the sole owner', async () => {
    members.admin = membership('admin', ADMIN.id);
    members.owner = membership('owner', OWNER.id);
    memberships.countByRoleInOrg.mockResolvedValue(1);

    await expect(
      useCase.execute({ callerUserId: 'admin', gymId: GYM, targetUserId: 'owner', roleId: ADMIN.id }),
    ).rejects.toBeInstanceOf(SoleOwnerError);
    expect(memberships.save).not.toHaveBeenCalled();
  });

  it('allows demoting an owner when another owner remains', async () => {
    members.admin = membership('admin', ADMIN.id);
    members.owner = membership('owner', OWNER.id);
    memberships.countByRoleInOrg.mockResolvedValue(2);

    const result = await useCase.execute({
      callerUserId: 'admin',
      gymId: GYM,
      targetUserId: 'owner',
      roleId: ADMIN.id,
    });

    expect(result.role).toEqual(ADMIN);
  });

  it('rejects an unknown target membership', async () => {
    members.admin = membership('admin', ADMIN.id);

    await expect(
      useCase.execute({ callerUserId: 'admin', gymId: GYM, targetUserId: 'ghost', roleId: INSTRUCTOR.id }),
    ).rejects.toBeInstanceOf(MembershipNotFoundError);
  });

  it('propagates a permission denial', async () => {
    permissions.requirePermission.mockRejectedValue(new PermissionDeniedError());

    await expect(
      useCase.execute({ callerUserId: 'member', gymId: GYM, targetUserId: 'bob', roleId: INSTRUCTOR.id }),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
    expect(memberships.save).not.toHaveBeenCalled();
  });
});
