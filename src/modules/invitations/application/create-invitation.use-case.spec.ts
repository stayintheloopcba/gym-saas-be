import { ConfigService } from '@nestjs/config';
import { InvitationStatus } from '../../../common/enums/invitation-status.enum';
import { MembershipRole } from '../../../common/enums/membership-role.enum';
import { Membership } from '../../memberships/domain/membership.entity';
import { MembershipRepository } from '../../memberships/domain/membership.repository';
import { OrganizationPermissionService } from '../../permissions/application/organization-permission.service';
import { PermissionDeniedError } from '../../permissions/domain/permission.errors';
import { FindUserByEmailUseCase } from '../../users/application/find-user.use-cases';
import { Invitation } from '../domain/invitation.entity';
import { AlreadyMemberError } from '../domain/invitation.errors';
import { InvitationRepository } from '../domain/invitation.repository';
import { CreateInvitationUseCase } from './create-invitation.use-case';

const ORG = 'org-1';

const membership = (userId: string, role: MembershipRole): Membership =>
  Object.assign(new Membership(), { id: `m-${userId}`, userId, organizationId: ORG, role });

describe('CreateInvitationUseCase', () => {
  let invitations: jest.Mocked<InvitationRepository>;
  let memberships: jest.Mocked<MembershipRepository>;
  let findUserByEmail: { execute: jest.Mock };
  let permissions: { requirePermission: jest.Mock };
  let useCase: CreateInvitationUseCase;

  beforeEach(() => {
    invitations = {
      findById: jest.fn(),
      findByToken: jest.fn(),
      findPendingByOrgAndEmail: jest.fn(),
      findPendingByOrg: jest.fn(),
      findPendingByEmail: jest.fn(),
      save: jest.fn((inv: Invitation) => Promise.resolve(inv)),
    };
    memberships = {
      findByUserAndOrg: jest.fn(),
      findByUser: jest.fn(),
      findByOrg: jest.fn(),
      countOwners: jest.fn(),
      countByRole: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    };
    findUserByEmail = { execute: jest.fn() };
    permissions = { requirePermission: jest.fn() };
    const config = { get: () => '7d' } as unknown as ConfigService;
    useCase = new CreateInvitationUseCase(
      invitations,
      memberships,
      findUserByEmail as unknown as FindUserByEmailUseCase,
      permissions as unknown as OrganizationPermissionService,
      config,
    );
  });

  const command = { callerUserId: 'admin', organizationId: ORG, email: 'new@example.com', role: MembershipRole.MEMBER };

  it('rejects a caller without OWNER/ADMIN role', async () => {
    permissions.requirePermission.mockRejectedValue(new PermissionDeniedError());

    await expect(useCase.execute({ ...command, callerUserId: 'member' })).rejects.toBeInstanceOf(PermissionDeniedError);
    expect(invitations.save).not.toHaveBeenCalled();
  });

  it('rejects inviting an email that is already an active member', async () => {
    memberships.findByUserAndOrg.mockImplementation((userId) =>
      Promise.resolve(
        userId === 'admin' ? membership('admin', MembershipRole.ADMIN) : membership('new-id', MembershipRole.MEMBER),
      ),
    );
    findUserByEmail.execute.mockResolvedValue({ id: 'new-id' });

    await expect(useCase.execute(command)).rejects.toBeInstanceOf(AlreadyMemberError);
    expect(invitations.save).not.toHaveBeenCalled();
  });

  it('is idempotent: returns the existing pending invitation instead of duplicating', async () => {
    memberships.findByUserAndOrg.mockImplementation((userId) =>
      Promise.resolve(userId === 'admin' ? membership('admin', MembershipRole.ADMIN) : null),
    );
    findUserByEmail.execute.mockResolvedValue(null);
    const existing = Object.assign(new Invitation(), { id: 'inv-existing', status: InvitationStatus.PENDING });
    invitations.findPendingByOrgAndEmail.mockResolvedValue(existing);

    const result = await useCase.execute(command);

    expect(result).toBe(existing);
    expect(invitations.save).not.toHaveBeenCalled();
  });
});
