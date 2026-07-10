import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PermissionRepository } from '../../permissions/domain/permission.repository';
import { Member } from '../domain/member.entity';
import { MemberNotFoundError, SoleOwnerError } from '../domain/member.errors';
import { MemberRepository } from '../domain/member.repository';
import { RemoveMemberUseCase } from './remove-member.use-case';

describe('RemoveMemberUseCase', () => {
  let members: jest.Mocked<Pick<MemberRepository, 'findById' | 'countByRoleInGym' | 'softDelete'>>;
  let permissionsRepo: jest.Mocked<Pick<PermissionRepository, 'findRoleSummary'>>;
  let permissions: jest.Mocked<Pick<GymPermissionService, 'requirePermission'>>;
  let useCase: RemoveMemberUseCase;

  beforeEach(() => {
    members = { findById: jest.fn(), countByRoleInGym: jest.fn(), softDelete: jest.fn() };
    permissionsRepo = {
      findRoleSummary: jest.fn().mockResolvedValue({ id: 'role-1', key: 'student', name: 'Student' }),
    };
    permissions = { requirePermission: jest.fn().mockResolvedValue(undefined) };
    useCase = new RemoveMemberUseCase(
      members as unknown as MemberRepository,
      permissionsRepo as unknown as PermissionRepository,
      permissions as unknown as GymPermissionService,
    );
  });

  it('soft-deletes an existing member', async () => {
    members.findById.mockResolvedValue(Object.assign(new Member(), { id: 'member-1', roleId: 'role-1' }));

    await useCase.execute('admin', 'gym-1', 'member-1');

    expect(members.softDelete).toHaveBeenCalledWith('member-1');
  });

  it('throws MemberNotFoundError when the member does not exist', async () => {
    members.findById.mockResolvedValue(null);

    await expect(useCase.execute('admin', 'gym-1', 'missing')).rejects.toBeInstanceOf(MemberNotFoundError);
    expect(members.softDelete).not.toHaveBeenCalled();
  });

  it('rejects removing the sole owner', async () => {
    members.findById.mockResolvedValue(Object.assign(new Member(), { id: 'member-1', roleId: 'role-owner' }));
    permissionsRepo.findRoleSummary.mockResolvedValue({ id: 'role-owner', key: 'owner', name: 'Dueño' });
    members.countByRoleInGym.mockResolvedValue(1);

    await expect(useCase.execute('admin', 'gym-1', 'member-1')).rejects.toBeInstanceOf(SoleOwnerError);
    expect(members.softDelete).not.toHaveBeenCalled();
  });

  it('allows removing an owner when there are other owners', async () => {
    members.findById.mockResolvedValue(Object.assign(new Member(), { id: 'member-1', roleId: 'role-owner' }));
    permissionsRepo.findRoleSummary.mockResolvedValue({ id: 'role-owner', key: 'owner', name: 'Dueño' });
    members.countByRoleInGym.mockResolvedValue(2);

    await useCase.execute('admin', 'gym-1', 'member-1');

    expect(members.softDelete).toHaveBeenCalledWith('member-1');
  });
});
