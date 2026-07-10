import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PermissionRepository } from '../../permissions/domain/permission.repository';
import { Member } from '../domain/member.entity';
import { MemberStatus } from '../domain/member-status.enum';
import { DuplicateMemberError, MemberNotFoundError } from '../domain/member.errors';
import { MemberRepository } from '../domain/member.repository';
import { ResolveMemberStatus } from './resolve-member-status';
import { UpdateMemberUseCase } from './update-member.use-case';

const buildMember = (overrides: Partial<Member> = {}): Member =>
  Object.assign(new Member(), {
    id: 'member-1',
    gymId: 'gym-1',
    roleId: 'role-1',
    firstName: 'Ada',
    lastName: 'Lovelace',
    documentId: '30111222',
    status: MemberStatus.ACTIVE,
    ...overrides,
  });

describe('UpdateMemberUseCase', () => {
  let members: jest.Mocked<Pick<MemberRepository, 'findById' | 'findByGymAndDocumentId' | 'save'>>;
  let permissionsRepo: jest.Mocked<Pick<PermissionRepository, 'findRoleSummary'>>;
  let resolveMemberStatus: jest.Mocked<Pick<ResolveMemberStatus, 'execute'>>;
  let permissions: jest.Mocked<Pick<GymPermissionService, 'requirePermission'>>;
  let useCase: UpdateMemberUseCase;

  beforeEach(() => {
    members = {
      findById: jest.fn(),
      findByGymAndDocumentId: jest.fn(),
      save: jest.fn((member: Member) => Promise.resolve(member)),
    };
    permissionsRepo = {
      findRoleSummary: jest.fn().mockResolvedValue({ id: 'role-1', key: 'student', name: 'Student' }),
    };
    resolveMemberStatus = { execute: jest.fn().mockResolvedValue(MemberStatus.ACTIVE) };
    permissions = { requirePermission: jest.fn().mockResolvedValue(undefined) };
    useCase = new UpdateMemberUseCase(
      members as unknown as MemberRepository,
      permissionsRepo as unknown as PermissionRepository,
      resolveMemberStatus as unknown as ResolveMemberStatus,
      permissions as unknown as GymPermissionService,
    );
  });

  it('applies only the provided fields', async () => {
    members.findById.mockResolvedValue(buildMember());

    const view = await useCase.execute({ callerUserId: 'admin', gymId: 'gym-1', memberId: 'member-1', phone: '123' });

    expect(view.phone).toBe('123');
    expect(view.firstName).toBe('Ada');
  });

  it('throws MemberNotFoundError when the member does not exist', async () => {
    members.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ callerUserId: 'admin', gymId: 'gym-1', memberId: 'missing', phone: '123' }),
    ).rejects.toBeInstanceOf(MemberNotFoundError);
  });

  it('rejects changing documentId to one already used by another member', async () => {
    members.findById.mockResolvedValue(buildMember());
    members.findByGymAndDocumentId.mockResolvedValue(buildMember({ id: 'other-member' }));

    await expect(
      useCase.execute({ callerUserId: 'admin', gymId: 'gym-1', memberId: 'member-1', documentId: '99999999' }),
    ).rejects.toBeInstanceOf(DuplicateMemberError);
  });

  it('allows keeping the same documentId unchanged', async () => {
    members.findById.mockResolvedValue(buildMember());

    await useCase.execute({ callerUserId: 'admin', gymId: 'gym-1', memberId: 'member-1', documentId: '30111222' });

    expect(members.findByGymAndDocumentId).not.toHaveBeenCalled();
  });
});
