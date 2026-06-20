import { HierarchyLevel } from '../../../common/enums/hierarchy-level.enum';
import { MembershipRole } from '../../../common/enums/membership-role.enum';
import { Membership } from '../../memberships/domain/membership.entity';
import { MembershipRepository } from '../../memberships/domain/membership.repository';
import { CannotChangeOwnRoleError } from '../../memberships/domain/membership.errors';
import { OrganizationPermissionService } from '../../permissions/application/organization-permission.service';
import { OwnershipContextService } from '../../permissions/application/ownership-context.service';
import { Role } from '../../permissions/domain/role.entity';
import { FindUserByIdUseCase } from '../../users/application/find-user.use-cases';
import { User } from '../../users/domain/user.entity';
import { AuthProvider } from '../../../common/enums/auth-provider.enum';
import { RoleNotFoundError } from '../domain/role.errors';
import { RoleRepository } from '../domain/role.repository';
import { AssignMemberCustomRoleUseCase } from './assign-member-custom-role.use-case';

const ORG = 'org-1';
const CALLER = 'owner';
const TARGET = 'member';

const membership = (userId: string, role = MembershipRole.MEMBER): Membership =>
  Object.assign(new Membership(), {
    id: `membership-${userId}`,
    userId,
    organizationId: ORG,
    role,
    roleId: null,
  });

const customRole = (over: Partial<Role> = {}): Role =>
  Object.assign(new Role(), {
    id: 'role-1',
    organizationId: ORG,
    name: 'Editor',
    isSystem: false,
    hierarchyLevel: HierarchyLevel.SELF,
    ...over,
  });

describe('AssignMemberCustomRoleUseCase', () => {
  let roles: jest.Mocked<RoleRepository>;
  let memberships: jest.Mocked<MembershipRepository>;
  let permissions: { requirePermission: jest.Mock };
  let ownership: { build: jest.Mock };
  let findUserById: { execute: jest.Mock };
  let useCase: AssignMemberCustomRoleUseCase;
  let target: Membership;

  beforeEach(() => {
    target = membership(TARGET);
    roles = {
      findById: jest.fn().mockResolvedValue(customRole()),
      findActiveByName: jest.fn(),
      listForOrganization: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    };
    memberships = {
      findByUserAndOrg: jest.fn((userId: string, _organizationId: string) =>
        Promise.resolve(userId === TARGET ? target : membership(CALLER, MembershipRole.OWNER)),
      ),
      findByUser: jest.fn(),
      findByOrg: jest.fn(),
      countOwners: jest.fn(),
      countByRole: jest.fn(),
      save: jest.fn((value) => Promise.resolve(value)),
      softDelete: jest.fn(),
    };
    permissions = { requirePermission: jest.fn() };
    ownership = {
      build: jest.fn((userId: string) =>
        Promise.resolve({
          userId,
          organizationId: ORG,
          hierarchyLevel: userId === CALLER ? HierarchyLevel.ORGANIZATION : HierarchyLevel.SELF,
        }),
      ),
    };
    findUserById = {
      execute: jest.fn((id: string) =>
        Promise.resolve(
          Object.assign(new User(), {
            id,
            email: `${id}@example.com`,
            name: id,
            provider: AuthProvider.LOCAL,
          }),
        ),
      ),
    };
    useCase = new AssignMemberCustomRoleUseCase(
      roles,
      memberships,
      permissions as unknown as OrganizationPermissionService,
      ownership as unknown as OwnershipContextService,
      findUserById as unknown as FindUserByIdUseCase,
    );
  });

  it('assigns a custom role from the same organization', async () => {
    const result = await useCase.execute({
      callerUserId: CALLER,
      organizationId: ORG,
      targetUserId: TARGET,
      roleId: 'role-1',
    });

    expect(target.roleId).toBe('role-1');
    expect(memberships.save).toHaveBeenCalledWith(target);
    expect(result.customRoleId).toBe('role-1');
  });

  it('clears the custom role without changing the system baseline', async () => {
    target.roleId = 'role-1';

    const result = await useCase.execute({
      callerUserId: CALLER,
      organizationId: ORG,
      targetUserId: TARGET,
      roleId: null,
    });

    expect(target.roleId).toBeNull();
    expect(result.role).toBe(MembershipRole.MEMBER);
    expect(result.customRoleId).toBeNull();
  });

  it('rejects a role from another organization', async () => {
    roles.findById.mockResolvedValue(customRole({ organizationId: 'other-org' }));

    await expect(
      useCase.execute({
        callerUserId: CALLER,
        organizationId: ORG,
        targetUserId: TARGET,
        roleId: 'role-1',
      }),
    ).rejects.toBeInstanceOf(RoleNotFoundError);
  });

  it('rejects changing your own custom role', async () => {
    await expect(
      useCase.execute({
        callerUserId: CALLER,
        organizationId: ORG,
        targetUserId: CALLER,
        roleId: 'role-1',
      }),
    ).rejects.toBeInstanceOf(CannotChangeOwnRoleError);
  });
});
