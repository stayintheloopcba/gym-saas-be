import { ConfigService } from '@nestjs/config';
import { InvitationStatus } from '../../../common/enums/invitation-status.enum';
import { Membership } from '../../memberships/domain/membership.entity';
import { MembershipRepository } from '../../memberships/domain/membership.repository';
import { OrganizationPermissionService } from '../../permissions/application/organization-permission.service';
import { PermissionDeniedError } from '../../permissions/domain/permission.errors';
import { PermissionRepository } from '../../permissions/domain/permission.repository';
import { RoleSummary } from '../../permissions/domain/role-summary';
import { FindUserByEmailUseCase } from '../../users/application/find-user.use-cases';
import { Invitation } from '../domain/invitation.entity';
import { AlreadyMemberError, OwnerRoleNotInvitableError, UnknownRoleError } from '../domain/invitation.errors';
import { InvitationRepository } from '../domain/invitation.repository';
import { CreateInvitationUseCase } from './create-invitation.use-case';

const ORG = 'org-1';
const OWNER: RoleSummary = { id: 'role-owner', key: 'owner', name: 'Dueño' };
const INSTRUCTOR: RoleSummary = { id: 'role-instructor', key: 'instructor', name: 'Instructor' };
const ROLES: Record<string, RoleSummary> = { [OWNER.id]: OWNER, [INSTRUCTOR.id]: INSTRUCTOR };

const membership = (userId: string, roleId: string): Membership =>
  Object.assign(new Membership(), { id: `m-${userId}`, userId, organizationId: ORG, roleId });

describe('CreateInvitationUseCase', () => {
  let invitations: jest.Mocked<InvitationRepository>;
  let memberships: jest.Mocked<MembershipRepository>;
  let permissionsRepo: { findRoleSummary: jest.Mock };
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
      countPendingByRole: jest.fn(),
      save: jest.fn((inv: Invitation) => Promise.resolve(inv)),
    };
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
    findUserByEmail = { execute: jest.fn() };
    permissions = { requirePermission: jest.fn() };
    const config = { get: () => '7d' } as unknown as ConfigService;
    useCase = new CreateInvitationUseCase(
      invitations,
      memberships,
      permissionsRepo as unknown as PermissionRepository,
      findUserByEmail as unknown as FindUserByEmailUseCase,
      permissions as unknown as OrganizationPermissionService,
      config,
    );
  });

  const command = { callerUserId: 'admin', organizationId: ORG, email: 'new@example.com', roleId: INSTRUCTOR.id };

  it('rejects a caller without members:invite', async () => {
    permissions.requirePermission.mockRejectedValue(new PermissionDeniedError());

    await expect(useCase.execute({ ...command, callerUserId: 'member' })).rejects.toBeInstanceOf(PermissionDeniedError);
    expect(invitations.save).not.toHaveBeenCalled();
  });

  it('rejects an unknown roleId', async () => {
    await expect(useCase.execute({ ...command, roleId: 'ghost-role' })).rejects.toBeInstanceOf(UnknownRoleError);
    expect(invitations.save).not.toHaveBeenCalled();
  });

  it('rejects inviting the owner role', async () => {
    await expect(useCase.execute({ ...command, roleId: OWNER.id })).rejects.toBeInstanceOf(OwnerRoleNotInvitableError);
    expect(invitations.save).not.toHaveBeenCalled();
  });

  it('rejects inviting an email that is already an active member', async () => {
    memberships.findByUserAndOrg.mockImplementation((userId) =>
      Promise.resolve(userId === 'admin' ? membership('admin', OWNER.id) : membership('new-id', INSTRUCTOR.id)),
    );
    findUserByEmail.execute.mockResolvedValue({ id: 'new-id' });

    await expect(useCase.execute(command)).rejects.toBeInstanceOf(AlreadyMemberError);
    expect(invitations.save).not.toHaveBeenCalled();
  });

  it('is idempotent: returns the existing pending invitation instead of duplicating', async () => {
    memberships.findByUserAndOrg.mockImplementation((userId) =>
      Promise.resolve(userId === 'admin' ? membership('admin', OWNER.id) : null),
    );
    findUserByEmail.execute.mockResolvedValue(null);
    const existing = Object.assign(new Invitation(), { id: 'inv-existing', status: InvitationStatus.PENDING });
    invitations.findPendingByOrgAndEmail.mockResolvedValue(existing);

    const result = await useCase.execute(command);

    expect(result).toBe(existing);
    expect(invitations.save).not.toHaveBeenCalled();
  });

  it('creates the invitation with the resolved roleId on the happy path', async () => {
    memberships.findByUserAndOrg.mockImplementation((userId) =>
      Promise.resolve(userId === 'admin' ? membership('admin', OWNER.id) : null),
    );
    findUserByEmail.execute.mockResolvedValue(null);
    invitations.findPendingByOrgAndEmail.mockResolvedValue(null);

    const result = await useCase.execute(command);

    expect(result.roleId).toBe(INSTRUCTOR.id);
    expect(invitations.save).toHaveBeenCalledWith(expect.objectContaining({ roleId: INSTRUCTOR.id }));
  });
});
