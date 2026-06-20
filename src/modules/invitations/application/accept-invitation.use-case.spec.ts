import { InvitationStatus } from '../../../common/enums/invitation-status.enum';
import { MembershipRole } from '../../../common/enums/membership-role.enum';
import { Membership } from '../../memberships/domain/membership.entity';
import { MembershipRepository } from '../../memberships/domain/membership.repository';
import { Invitation } from '../domain/invitation.entity';
import {
  AlreadyMemberError,
  InvitationEmailMismatchError,
  InvitationExpiredError,
  InvitationNotPendingError,
} from '../domain/invitation.errors';
import { InvitationRepository } from '../domain/invitation.repository';
import { AcceptInvitationUseCase } from './accept-invitation.use-case';
import { InvitationUnitOfWork } from './invitation-unit-of-work.port';

const invitation = (overrides: Partial<Invitation> = {}): Invitation =>
  Object.assign(new Invitation(), {
    id: 'inv-1',
    organizationId: 'org-1',
    email: 'bob@example.com',
    role: MembershipRole.MEMBER,
    token: 'tok',
    status: InvitationStatus.PENDING,
    expiresAt: new Date(Date.now() + 60_000),
    ...overrides,
  });

describe('AcceptInvitationUseCase', () => {
  let invitations: jest.Mocked<InvitationRepository>;
  let memberships: jest.Mocked<MembershipRepository>;
  let unitOfWork: jest.Mocked<InvitationUnitOfWork>;
  let useCase: AcceptInvitationUseCase;

  beforeEach(() => {
    invitations = {
      findById: jest.fn(),
      findByToken: jest.fn(),
      findPendingByOrgAndEmail: jest.fn(),
      findPendingByOrg: jest.fn(),
      findPendingByEmail: jest.fn(),
      save: jest.fn(),
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
    unitOfWork = { acceptInvitation: jest.fn((m: Membership, _inv: Invitation) => Promise.resolve(m)) };
    useCase = new AcceptInvitationUseCase(invitations, memberships, unitOfWork);
  });

  const command = { callerUserId: 'u-bob', callerEmail: 'bob@example.com', token: 'tok' };

  it('creates the membership and marks the invitation ACCEPTED on the happy path', async () => {
    invitations.findByToken.mockResolvedValue(invitation());
    memberships.findByUserAndOrg.mockResolvedValue(null);

    const membership = await useCase.execute(command);

    expect(membership.organizationId).toBe('org-1');
    expect(membership.role).toBe(MembershipRole.MEMBER);
    expect(unitOfWork.acceptInvitation).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u-bob', organizationId: 'org-1' }),
      expect.objectContaining({ status: InvitationStatus.ACCEPTED }),
    );
  });

  it('rejects when the caller email does not match the invitation', async () => {
    invitations.findByToken.mockResolvedValue(invitation());

    await expect(useCase.execute({ ...command, callerEmail: 'eve@example.com' })).rejects.toBeInstanceOf(
      InvitationEmailMismatchError,
    );
    expect(unitOfWork.acceptInvitation).not.toHaveBeenCalled();
  });

  it('rejects an expired invitation', async () => {
    invitations.findByToken.mockResolvedValue(invitation({ expiresAt: new Date(Date.now() - 1) }));

    await expect(useCase.execute(command)).rejects.toBeInstanceOf(InvitationExpiredError);
  });

  it('rejects an already-resolved invitation', async () => {
    invitations.findByToken.mockResolvedValue(invitation({ status: InvitationStatus.ACCEPTED }));

    await expect(useCase.execute(command)).rejects.toBeInstanceOf(InvitationNotPendingError);
  });

  it('rejects when the caller is already a member', async () => {
    invitations.findByToken.mockResolvedValue(invitation());
    memberships.findByUserAndOrg.mockResolvedValue({ id: 'm-1' } as Membership);

    await expect(useCase.execute(command)).rejects.toBeInstanceOf(AlreadyMemberError);
    expect(unitOfWork.acceptInvitation).not.toHaveBeenCalled();
  });
});
