import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { DuplicateMemberError } from '../domain/member.errors';
import { MemberRepository } from '../domain/member.repository';
import { Member } from '../domain/member.entity';
import { MemberStatus } from '../domain/member-status.enum';
import { CreateMemberUseCase } from './create-member.use-case';

describe('CreateMemberUseCase', () => {
  let members: jest.Mocked<MemberRepository>;
  let permissions: jest.Mocked<Pick<GymPermissionService, 'requirePermission'>>;
  let useCase: CreateMemberUseCase;

  beforeEach(() => {
    members = {
      findById: jest.fn(),
      findByGymAndUserId: jest.fn(),
      findByGymAndDocumentId: jest.fn().mockResolvedValue(null),
      findByUserId: jest.fn(),
      list: jest.fn(),
      countByRoleInGym: jest.fn(),
      countByRole: jest.fn(),
      save: jest.fn((member: Member) => Promise.resolve(member)),
      softDelete: jest.fn(),
    };
    permissions = { requirePermission: jest.fn().mockResolvedValue(undefined) };
    useCase = new CreateMemberUseCase(members, permissions as unknown as GymPermissionService);
  });

  it('creates a member without an account (userId stays null)', async () => {
    const member = await useCase.execute({
      callerUserId: 'admin',
      gymId: 'gym-1',
      roleId: 'role-student',
      firstName: 'Ada',
      lastName: 'Lovelace',
    });

    expect(member.userId).toBeNull();
    expect(member.status).toBe(MemberStatus.ACTIVE);
    expect(members.save).toHaveBeenCalled();
  });

  it('rejects a duplicate documentId in the same gym', async () => {
    members.findByGymAndDocumentId.mockResolvedValue({ id: 'existing' } as Member);

    await expect(
      useCase.execute({
        callerUserId: 'admin',
        gymId: 'gym-1',
        roleId: 'role-student',
        firstName: 'Ada',
        lastName: 'Lovelace',
        documentId: '30111222',
      }),
    ).rejects.toBeInstanceOf(DuplicateMemberError);
    expect(members.save).not.toHaveBeenCalled();
  });

  it('skips the duplicate check when no documentId is provided', async () => {
    await useCase.execute({
      callerUserId: 'admin',
      gymId: 'gym-1',
      roleId: 'role-student',
      firstName: 'Ada',
      lastName: 'Lovelace',
    });

    expect(members.findByGymAndDocumentId).not.toHaveBeenCalled();
  });
});
