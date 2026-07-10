import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { Member } from '../domain/member.entity';
import { MemberNotFoundError } from '../domain/member.errors';
import { MemberRepository } from '../domain/member.repository';
import { RemoveMemberUseCase } from './remove-member.use-case';

describe('RemoveMemberUseCase', () => {
  let members: jest.Mocked<Pick<MemberRepository, 'findById' | 'softDelete'>>;
  let permissions: jest.Mocked<Pick<GymPermissionService, 'requirePermission'>>;
  let useCase: RemoveMemberUseCase;

  beforeEach(() => {
    members = { findById: jest.fn(), softDelete: jest.fn() };
    permissions = { requirePermission: jest.fn().mockResolvedValue(undefined) };
    useCase = new RemoveMemberUseCase(
      members as unknown as MemberRepository,
      permissions as unknown as GymPermissionService,
    );
  });

  it('soft-deletes an existing member', async () => {
    members.findById.mockResolvedValue(Object.assign(new Member(), { id: 'member-1' }));

    await useCase.execute('admin', 'gym-1', 'member-1');

    expect(members.softDelete).toHaveBeenCalledWith('member-1');
  });

  it('throws MemberNotFoundError when the member does not exist', async () => {
    members.findById.mockResolvedValue(null);

    await expect(useCase.execute('admin', 'gym-1', 'missing')).rejects.toBeInstanceOf(MemberNotFoundError);
    expect(members.softDelete).not.toHaveBeenCalled();
  });
});
