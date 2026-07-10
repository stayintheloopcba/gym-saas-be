import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PermissionRepository } from '../../permissions/domain/permission.repository';
import { CreateUserUseCase } from '../../users/application/create-user.use-case';
import { FindUserByEmailUseCase } from '../../users/application/find-user.use-cases';
import { User } from '../../users/domain/user.entity';
import { Member } from '../domain/member.entity';
import { MemberStatus } from '../domain/member-status.enum';
import { DuplicateMemberError, MemberAlreadyLinkedError, MemberNotFoundError } from '../domain/member.errors';
import { MemberRepository } from '../domain/member.repository';
import { GrantPortalAccessUseCase } from './grant-portal-access.use-case';

const buildMember = (overrides: Partial<Member> = {}): Member =>
  Object.assign(new Member(), {
    id: 'member-1',
    gymId: 'gym-1',
    userId: null,
    roleId: 'role-1',
    firstName: 'Ada',
    lastName: 'Lovelace',
    status: MemberStatus.ACTIVE,
    ...overrides,
  });

describe('GrantPortalAccessUseCase', () => {
  let members: jest.Mocked<Pick<MemberRepository, 'findById' | 'findByGymAndUserId' | 'save'>>;
  let permissionsRepo: jest.Mocked<Pick<PermissionRepository, 'findRoleSummary'>>;
  let permissions: jest.Mocked<Pick<GymPermissionService, 'requirePermission'>>;
  let findUserByEmail: jest.Mocked<Pick<FindUserByEmailUseCase, 'execute'>>;
  let createUser: jest.Mocked<Pick<CreateUserUseCase, 'execute'>>;
  let useCase: GrantPortalAccessUseCase;

  beforeEach(() => {
    members = {
      findById: jest.fn(),
      findByGymAndUserId: jest.fn(),
      save: jest.fn((member: Member) => Promise.resolve(member)),
    };
    permissionsRepo = {
      findRoleSummary: jest.fn().mockResolvedValue({ id: 'role-1', key: 'student', name: 'Student' }),
    };
    permissions = { requirePermission: jest.fn().mockResolvedValue(undefined) };
    findUserByEmail = { execute: jest.fn() };
    createUser = { execute: jest.fn() };
    useCase = new GrantPortalAccessUseCase(
      members as unknown as MemberRepository,
      permissionsRepo as unknown as PermissionRepository,
      permissions as unknown as GymPermissionService,
      findUserByEmail as unknown as FindUserByEmailUseCase,
      createUser as unknown as CreateUserUseCase,
    );
  });

  it('links an existing user by email', async () => {
    const existingUser = Object.assign(new User(), { id: 'user-1', email: 'ada@example.com' });
    findUserByEmail.execute.mockResolvedValue(existingUser);
    members.findById.mockResolvedValue(buildMember());
    members.findByGymAndUserId.mockResolvedValue(null);

    const view = await useCase.execute({
      callerUserId: 'admin',
      gymId: 'gym-1',
      memberId: 'member-1',
      email: 'ada@example.com',
    });

    expect(view.userId).toBe('user-1');
    expect(createUser.execute).not.toHaveBeenCalled();
  });

  it('creates a new user when none exists for that email', async () => {
    findUserByEmail.execute.mockResolvedValue(null);
    createUser.execute.mockResolvedValue(Object.assign(new User(), { id: 'user-new', email: 'new@example.com' }));
    members.findById.mockResolvedValue(buildMember());

    const view = await useCase.execute({
      callerUserId: 'admin',
      gymId: 'gym-1',
      memberId: 'member-1',
      email: 'new@example.com',
    });

    expect(view.userId).toBe('user-new');
    expect(createUser.execute).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'new@example.com', name: 'Ada Lovelace' }),
    );
  });

  it('throws MemberNotFoundError when the member does not exist', async () => {
    members.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ callerUserId: 'admin', gymId: 'gym-1', memberId: 'missing', email: 'ada@example.com' }),
    ).rejects.toBeInstanceOf(MemberNotFoundError);
  });

  it('throws MemberAlreadyLinkedError when the member already has an account', async () => {
    members.findById.mockResolvedValue(buildMember({ userId: 'already-linked' }));

    await expect(
      useCase.execute({ callerUserId: 'admin', gymId: 'gym-1', memberId: 'member-1', email: 'ada@example.com' }),
    ).rejects.toBeInstanceOf(MemberAlreadyLinkedError);
  });

  it('throws DuplicateMemberError when the found user already has a Member in this gym', async () => {
    const existingUser = Object.assign(new User(), { id: 'user-1', email: 'ada@example.com' });
    findUserByEmail.execute.mockResolvedValue(existingUser);
    members.findById.mockResolvedValue(buildMember());
    members.findByGymAndUserId.mockResolvedValue(buildMember({ id: 'other-member', userId: 'user-1' }));

    await expect(
      useCase.execute({ callerUserId: 'admin', gymId: 'gym-1', memberId: 'member-1', email: 'ada@example.com' }),
    ).rejects.toBeInstanceOf(DuplicateMemberError);
  });
});
