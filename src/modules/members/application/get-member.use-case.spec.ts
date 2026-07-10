import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PermissionRepository } from '../../permissions/domain/permission.repository';
import { Member } from '../domain/member.entity';
import { MemberStatus } from '../domain/member-status.enum';
import { MemberNotFoundError } from '../domain/member.errors';
import { MemberRepository } from '../domain/member.repository';
import { GetMemberUseCase } from './get-member.use-case';
import { ResolveMemberStatus } from './resolve-member-status';

const buildMember = (): Member =>
  Object.assign(new Member(), {
    id: 'member-1',
    gymId: 'gym-1',
    roleId: 'role-1',
    firstName: 'Ada',
    lastName: 'Lovelace',
    status: MemberStatus.ACTIVE,
  });

describe('GetMemberUseCase', () => {
  let members: jest.Mocked<Pick<MemberRepository, 'findById'>>;
  let permissionsRepo: jest.Mocked<Pick<PermissionRepository, 'findRoleSummary'>>;
  let resolveMemberStatus: jest.Mocked<Pick<ResolveMemberStatus, 'execute'>>;
  let permissions: jest.Mocked<Pick<GymPermissionService, 'requirePermission'>>;
  let useCase: GetMemberUseCase;

  beforeEach(() => {
    members = { findById: jest.fn() };
    permissionsRepo = { findRoleSummary: jest.fn() };
    resolveMemberStatus = { execute: jest.fn().mockResolvedValue(MemberStatus.ACTIVE) };
    permissions = { requirePermission: jest.fn().mockResolvedValue(undefined) };
    useCase = new GetMemberUseCase(
      members as unknown as MemberRepository,
      permissionsRepo as unknown as PermissionRepository,
      resolveMemberStatus as unknown as ResolveMemberStatus,
      permissions as unknown as GymPermissionService,
    );
  });

  it('returns the member view with its role', async () => {
    members.findById.mockResolvedValue(buildMember());
    permissionsRepo.findRoleSummary.mockResolvedValue({ id: 'role-1', key: 'student', name: 'Student' });

    const view = await useCase.execute('admin', 'gym-1', 'member-1');

    expect(view.id).toBe('member-1');
    expect(view.role).toEqual({ id: 'role-1', key: 'student', name: 'Student' });
  });

  it('reflects the derived status instead of the stored one', async () => {
    members.findById.mockResolvedValue(buildMember());
    permissionsRepo.findRoleSummary.mockResolvedValue({ id: 'role-1', key: 'student', name: 'Student' });
    resolveMemberStatus.execute.mockResolvedValue(MemberStatus.OVERDUE);

    const view = await useCase.execute('admin', 'gym-1', 'member-1');

    expect(view.status).toBe(MemberStatus.OVERDUE);
  });

  it('throws MemberNotFoundError when the member does not exist in the gym', async () => {
    members.findById.mockResolvedValue(null);

    await expect(useCase.execute('admin', 'gym-1', 'missing')).rejects.toBeInstanceOf(MemberNotFoundError);
  });

  it('throws MemberNotFoundError when the role no longer exists', async () => {
    members.findById.mockResolvedValue(buildMember());
    permissionsRepo.findRoleSummary.mockResolvedValue(null);

    await expect(useCase.execute('admin', 'gym-1', 'member-1')).rejects.toBeInstanceOf(MemberNotFoundError);
  });
});
