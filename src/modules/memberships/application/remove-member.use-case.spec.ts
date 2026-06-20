import { MembershipRole } from '../../../common/enums/membership-role.enum';
import { OrganizationPermissionService } from '../../permissions/application/organization-permission.service';
import { PermissionDeniedError } from '../../permissions/domain/permission.errors';
import { Membership } from '../domain/membership.entity';
import { SoleOwnerError } from '../domain/membership.errors';
import { MembershipRepository } from '../domain/membership.repository';
import { RemoveMemberUseCase } from './remove-member.use-case';

const ORG = 'org-1';

const membership = (userId: string, role: MembershipRole): Membership =>
  Object.assign(new Membership(), { id: `m-${userId}`, userId, organizationId: ORG, role });

describe('RemoveMemberUseCase', () => {
  let memberships: jest.Mocked<MembershipRepository>;
  let permissions: { requirePermission: jest.Mock };
  let useCase: RemoveMemberUseCase;

  beforeEach(() => {
    memberships = {
      findByUserAndOrg: jest.fn(),
      findByUser: jest.fn(),
      findByOrg: jest.fn(),
      countOwners: jest.fn(),
      countByRole: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    };
    permissions = { requirePermission: jest.fn() };
    useCase = new RemoveMemberUseCase(memberships, permissions as unknown as OrganizationPermissionService);
  });

  it('lets an admin remove a regular member', async () => {
    memberships.findByUserAndOrg.mockImplementation((userId) =>
      Promise.resolve(
        userId === 'admin' ? membership('admin', MembershipRole.ADMIN) : membership('bob', MembershipRole.MEMBER),
      ),
    );

    await useCase.execute({ callerUserId: 'admin', organizationId: ORG, targetUserId: 'bob' });

    expect(memberships.softDelete).toHaveBeenCalledWith('m-bob');
  });

  it('rejects removing the sole owner', async () => {
    memberships.findByUserAndOrg.mockResolvedValue(membership('owner', MembershipRole.OWNER));
    memberships.countOwners.mockResolvedValue(1);

    await expect(
      useCase.execute({ callerUserId: 'owner', organizationId: ORG, targetUserId: 'owner' }),
    ).rejects.toBeInstanceOf(SoleOwnerError);
    expect(memberships.softDelete).not.toHaveBeenCalled();
  });

  it('rejects a member without privilege', async () => {
    permissions.requirePermission.mockRejectedValue(new PermissionDeniedError());

    await expect(
      useCase.execute({ callerUserId: 'member', organizationId: ORG, targetUserId: 'bob' }),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
    expect(memberships.softDelete).not.toHaveBeenCalled();
  });
});
