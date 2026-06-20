import { AuthProvider } from '../../../common/enums/auth-provider.enum';
import { MembershipRole } from '../../../common/enums/membership-role.enum';
import { OrganizationPermissionService } from '../../permissions/application/organization-permission.service';
import { PermissionDeniedError } from '../../permissions/domain/permission.errors';
import { FindUserByIdUseCase } from '../../users/application/find-user.use-cases';
import { User } from '../../users/domain/user.entity';
import { Membership } from '../domain/membership.entity';
import {
  CannotChangeOwnRoleError,
  InsufficientRoleError,
  MembershipNotFoundError,
  SoleOwnerError,
} from '../domain/membership.errors';
import { MembershipRepository } from '../domain/membership.repository';
import { ChangeMemberRoleUseCase } from './change-member-role.use-case';

const ORG = 'org-1';

const membership = (userId: string, role: MembershipRole): Membership =>
  Object.assign(new Membership(), { id: `m-${userId}`, userId, organizationId: ORG, role, roleId: null });

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
  let permissions: { requirePermission: jest.Mock };
  let findUserById: { execute: jest.Mock };
  let useCase: ChangeMemberRoleUseCase;

  const members: Record<string, Membership> = {};

  beforeEach(() => {
    memberships = {
      findByUserAndOrg: jest.fn((userId: string) => Promise.resolve(members[userId] ?? null)),
      findByUser: jest.fn(),
      findByOrg: jest.fn(),
      countOwners: jest.fn(),
      save: jest.fn((m: Membership) => Promise.resolve(m)),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<MembershipRepository>;
    permissions = { requirePermission: jest.fn() };
    findUserById = { execute: jest.fn((id: string) => Promise.resolve(user(id))) };
    useCase = new ChangeMemberRoleUseCase(
      memberships,
      permissions as unknown as OrganizationPermissionService,
      findUserById as unknown as FindUserByIdUseCase,
    );
    for (const key of Object.keys(members)) {
      delete members[key];
    }
  });

  it('lets an owner change a member to admin', async () => {
    members.owner = membership('owner', MembershipRole.OWNER);
    members.bob = membership('bob', MembershipRole.MEMBER);

    const result = await useCase.execute({
      callerUserId: 'owner',
      organizationId: ORG,
      targetUserId: 'bob',
      role: MembershipRole.ADMIN,
    });

    expect(memberships.save).toHaveBeenCalledWith(expect.objectContaining({ id: 'm-bob', role: MembershipRole.ADMIN }));
    expect(result.role).toBe(MembershipRole.ADMIN);
    expect(result.customRoleId).toBeNull();
  });

  it('rejects changing your own role', async () => {
    members.admin = membership('admin', MembershipRole.ADMIN);

    await expect(
      useCase.execute({
        callerUserId: 'admin',
        organizationId: ORG,
        targetUserId: 'admin',
        role: MembershipRole.MEMBER,
      }),
    ).rejects.toBeInstanceOf(CannotChangeOwnRoleError);
    expect(memberships.save).not.toHaveBeenCalled();
  });

  it('rejects acting on a member ranked above the caller', async () => {
    members.admin = membership('admin', MembershipRole.ADMIN);
    members.owner = membership('owner', MembershipRole.OWNER);

    await expect(
      useCase.execute({
        callerUserId: 'admin',
        organizationId: ORG,
        targetUserId: 'owner',
        role: MembershipRole.MEMBER,
      }),
    ).rejects.toBeInstanceOf(InsufficientRoleError);
    expect(memberships.save).not.toHaveBeenCalled();
  });

  it('rejects demoting the sole owner', async () => {
    members.owner = membership('owner', MembershipRole.OWNER);
    members.other = membership('other', MembershipRole.OWNER);
    // caller is `other` (also owner), demoting `owner`, but only 1 owner remains counted
    memberships.countOwners.mockResolvedValue(1);

    await expect(
      useCase.execute({
        callerUserId: 'other',
        organizationId: ORG,
        targetUserId: 'owner',
        role: MembershipRole.ADMIN,
      }),
    ).rejects.toBeInstanceOf(SoleOwnerError);
    expect(memberships.save).not.toHaveBeenCalled();
  });

  it('rejects an unknown target membership', async () => {
    members.owner = membership('owner', MembershipRole.OWNER);

    await expect(
      useCase.execute({
        callerUserId: 'owner',
        organizationId: ORG,
        targetUserId: 'ghost',
        role: MembershipRole.MEMBER,
      }),
    ).rejects.toBeInstanceOf(MembershipNotFoundError);
  });

  it('propagates a permission denial', async () => {
    permissions.requirePermission.mockRejectedValue(new PermissionDeniedError());

    await expect(
      useCase.execute({
        callerUserId: 'member',
        organizationId: ORG,
        targetUserId: 'bob',
        role: MembershipRole.MEMBER,
      }),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
    expect(memberships.save).not.toHaveBeenCalled();
  });
});
