import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PermissionRepository } from '../../permissions/domain/permission.repository';
import { Member } from '../domain/member.entity';
import { MemberStatus } from '../domain/member-status.enum';
import { MemberRepository } from '../domain/member.repository';
import { ListMembersUseCase } from './list-members.use-case';

const buildMember = (id: string): Member =>
  Object.assign(new Member(), { id, gymId: 'gym-1', roleId: 'role-1', firstName: 'Ada', status: MemberStatus.ACTIVE });

describe('ListMembersUseCase', () => {
  let members: jest.Mocked<Pick<MemberRepository, 'list'>>;
  let permissionsRepo: jest.Mocked<Pick<PermissionRepository, 'findRoleSummary'>>;
  let permissions: jest.Mocked<Pick<GymPermissionService, 'requirePermission'>>;
  let useCase: ListMembersUseCase;

  beforeEach(() => {
    members = { list: jest.fn() };
    permissionsRepo = { findRoleSummary: jest.fn() };
    permissions = { requirePermission: jest.fn().mockResolvedValue(undefined) };
    useCase = new ListMembersUseCase(
      members as unknown as MemberRepository,
      permissionsRepo as unknown as PermissionRepository,
      permissions as unknown as GymPermissionService,
    );
  });

  it('maps each member to its view with the resolved role', async () => {
    members.list.mockResolvedValue([buildMember('m1'), buildMember('m2')]);
    permissionsRepo.findRoleSummary.mockResolvedValue({ id: 'role-1', key: 'student', name: 'Student' });

    const views = await useCase.execute('admin', 'gym-1', {});

    expect(views).toHaveLength(2);
    expect(views[0].role.key).toBe('student');
  });

  it('skips members whose role no longer exists in the catalog', async () => {
    members.list.mockResolvedValue([buildMember('m1')]);
    permissionsRepo.findRoleSummary.mockResolvedValue(null);

    const views = await useCase.execute('admin', 'gym-1', {});

    expect(views).toHaveLength(0);
  });

  it('forwards the filters to the repository', async () => {
    members.list.mockResolvedValue([]);

    await useCase.execute('admin', 'gym-1', { status: MemberStatus.ACTIVE, branchId: 'branch-1' });

    expect(members.list).toHaveBeenCalledWith('gym-1', { status: MemberStatus.ACTIVE, branchId: 'branch-1' });
  });
});
