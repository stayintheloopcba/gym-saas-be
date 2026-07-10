import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PermissionRepository } from '../../permissions/domain/permission.repository';
import { Member } from '../domain/member.entity';
import { MemberStatus } from '../domain/member-status.enum';
import {
  CannotChangeOwnRoleError,
  MemberNotFoundError,
  OwnerRoleNotAssignableError,
  SoleOwnerError,
  UnknownRoleError,
} from '../domain/member.errors';
import { MemberRepository } from '../domain/member.repository';
import { ChangeMemberRoleUseCase } from './change-member-role.use-case';
import { ResolveMemberStatus } from './resolve-member-status';

const OWNER = { id: 'role-owner', key: 'owner', name: 'Dueño' };
const INSTRUCTOR = { id: 'role-instructor', key: 'instructor', name: 'Instructor' };
const ADMIN = { id: 'role-admin', key: 'admin', name: 'Administrador' };

const buildMember = (overrides: Partial<Member> = {}): Member =>
  Object.assign(new Member(), {
    id: 'member-1',
    gymId: 'gym-1',
    userId: 'target-user',
    roleId: INSTRUCTOR.id,
    firstName: 'Ada',
    lastName: 'Lovelace',
    status: MemberStatus.ACTIVE,
    ...overrides,
  });

describe('ChangeMemberRoleUseCase', () => {
  let members: jest.Mocked<Pick<MemberRepository, 'findById' | 'countByRoleInGym' | 'save'>>;
  let permissionsRepo: jest.Mocked<Pick<PermissionRepository, 'findRoleSummary'>>;
  let resolveMemberStatus: jest.Mocked<Pick<ResolveMemberStatus, 'execute'>>;
  let permissions: jest.Mocked<Pick<GymPermissionService, 'requirePermission'>>;
  let useCase: ChangeMemberRoleUseCase;

  beforeEach(() => {
    members = {
      findById: jest.fn(),
      countByRoleInGym: jest.fn(),
      save: jest.fn((member: Member) => Promise.resolve(member)),
    };
    permissionsRepo = { findRoleSummary: jest.fn() };
    resolveMemberStatus = { execute: jest.fn().mockResolvedValue(MemberStatus.ACTIVE) };
    permissions = { requirePermission: jest.fn().mockResolvedValue(undefined) };
    useCase = new ChangeMemberRoleUseCase(
      members as unknown as MemberRepository,
      permissionsRepo as unknown as PermissionRepository,
      resolveMemberStatus as unknown as ResolveMemberStatus,
      permissions as unknown as GymPermissionService,
    );
  });

  it('changes the role of a member', async () => {
    members.findById.mockResolvedValue(buildMember());
    permissionsRepo.findRoleSummary.mockResolvedValueOnce(ADMIN).mockResolvedValueOnce(INSTRUCTOR);

    const view = await useCase.execute({
      callerUserId: 'admin',
      gymId: 'gym-1',
      memberId: 'member-1',
      roleId: ADMIN.id,
    });

    expect(view.role).toEqual(ADMIN);
  });

  it('throws MemberNotFoundError when the target does not exist', async () => {
    members.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ callerUserId: 'admin', gymId: 'gym-1', memberId: 'missing', roleId: ADMIN.id }),
    ).rejects.toBeInstanceOf(MemberNotFoundError);
  });

  it('rejects changing your own role', async () => {
    members.findById.mockResolvedValue(buildMember({ userId: 'admin' }));

    await expect(
      useCase.execute({ callerUserId: 'admin', gymId: 'gym-1', memberId: 'member-1', roleId: ADMIN.id }),
    ).rejects.toBeInstanceOf(CannotChangeOwnRoleError);
  });

  it('rejects an unknown roleId', async () => {
    members.findById.mockResolvedValue(buildMember());
    permissionsRepo.findRoleSummary.mockResolvedValue(null);

    await expect(
      useCase.execute({ callerUserId: 'admin', gymId: 'gym-1', memberId: 'member-1', roleId: 'ghost-role' }),
    ).rejects.toBeInstanceOf(UnknownRoleError);
  });

  it('rejects assigning the owner role', async () => {
    members.findById.mockResolvedValue(buildMember());
    permissionsRepo.findRoleSummary.mockResolvedValue(OWNER);

    await expect(
      useCase.execute({ callerUserId: 'admin', gymId: 'gym-1', memberId: 'member-1', roleId: OWNER.id }),
    ).rejects.toBeInstanceOf(OwnerRoleNotAssignableError);
  });

  it('rejects demoting the sole owner', async () => {
    members.findById.mockResolvedValue(buildMember({ roleId: OWNER.id }));
    permissionsRepo.findRoleSummary.mockResolvedValueOnce(ADMIN).mockResolvedValueOnce(OWNER);
    members.countByRoleInGym.mockResolvedValue(1);

    await expect(
      useCase.execute({ callerUserId: 'admin', gymId: 'gym-1', memberId: 'member-1', roleId: ADMIN.id }),
    ).rejects.toBeInstanceOf(SoleOwnerError);
  });

  it('allows demoting an owner when there are other owners', async () => {
    members.findById.mockResolvedValue(buildMember({ roleId: OWNER.id }));
    permissionsRepo.findRoleSummary.mockResolvedValueOnce(ADMIN).mockResolvedValueOnce(OWNER);
    members.countByRoleInGym.mockResolvedValue(2);

    const view = await useCase.execute({
      callerUserId: 'admin',
      gymId: 'gym-1',
      memberId: 'member-1',
      roleId: ADMIN.id,
    });

    expect(view.role).toEqual(ADMIN);
  });

  it('is a no-op returning the current role when unchanged', async () => {
    members.findById.mockResolvedValue(buildMember({ roleId: INSTRUCTOR.id }));
    permissionsRepo.findRoleSummary.mockResolvedValueOnce(INSTRUCTOR);

    const view = await useCase.execute({
      callerUserId: 'admin',
      gymId: 'gym-1',
      memberId: 'member-1',
      roleId: INSTRUCTOR.id,
    });

    expect(view.role).toEqual(INSTRUCTOR);
    expect(members.save).not.toHaveBeenCalled();
  });
});
