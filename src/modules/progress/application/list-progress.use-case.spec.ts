import { Member } from '../../members/domain/member.entity';
import { MemberStatus } from '../../members/domain/member-status.enum';
import { MemberNotFoundError } from '../../members/domain/member.errors';
import { MemberRepository } from '../../members/domain/member.repository';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PermissionRepository } from '../../permissions/domain/permission.repository';
import { ProgressEntry } from '../domain/progress-entry.entity';
import { ProgressRepository } from '../domain/progress.repository';
import { ListProgressUseCase } from './list-progress.use-case';

const INSTRUCTOR = { id: 'role-instructor', key: 'instructor', name: 'Instructor' };
const STUDENT = { id: 'role-student', key: 'student', name: 'Alumno' };

const buildMember = (overrides: Partial<Member> = {}): Member =>
  Object.assign(new Member(), {
    id: 'member-1',
    gymId: 'gym-1',
    userId: 'caller-user',
    roleId: INSTRUCTOR.id,
    status: MemberStatus.ACTIVE,
    ...overrides,
  });

const buildEntry = (overrides: Partial<ProgressEntry> = {}): ProgressEntry =>
  Object.assign(new ProgressEntry(), {
    id: 'entry-1',
    gymId: 'gym-1',
    memberId: 'member-2',
    routineItemId: null,
    value: 80,
    reps: 8,
    recordedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  });

describe('ListProgressUseCase', () => {
  let progress: jest.Mocked<Pick<ProgressRepository, 'list'>>;
  let members: jest.Mocked<Pick<MemberRepository, 'findByGymAndUserId'>>;
  let permissionsRepo: jest.Mocked<Pick<PermissionRepository, 'findRoleSummary'>>;
  let permissions: jest.Mocked<Pick<GymPermissionService, 'requirePermission'>>;
  let useCase: ListProgressUseCase;

  beforeEach(() => {
    progress = { list: jest.fn().mockResolvedValue([buildEntry()]) };
    members = { findByGymAndUserId: jest.fn().mockResolvedValue(buildMember()) };
    permissionsRepo = { findRoleSummary: jest.fn().mockResolvedValue(INSTRUCTOR) };
    permissions = { requirePermission: jest.fn().mockResolvedValue(undefined) };
    useCase = new ListProgressUseCase(
      progress as unknown as ProgressRepository,
      members as unknown as MemberRepository,
      permissionsRepo as unknown as PermissionRepository,
      permissions as unknown as GymPermissionService,
    );
  });

  it('lists progress entries for a member', async () => {
    const views = await useCase.execute('caller-user', 'gym-1', 'member-2', {});

    expect(views).toHaveLength(1);
    expect(views[0].memberId).toBe('member-2');
  });

  it('rejects a student listing another member progress as not-found', async () => {
    members.findByGymAndUserId.mockResolvedValue(buildMember({ roleId: STUDENT.id }));
    permissionsRepo.findRoleSummary.mockResolvedValue(STUDENT);

    await expect(useCase.execute('caller-user', 'gym-1', 'member-2', {})).rejects.toBeInstanceOf(MemberNotFoundError);
  });

  it('allows a student listing their own progress', async () => {
    members.findByGymAndUserId.mockResolvedValue(buildMember({ roleId: STUDENT.id }));
    permissionsRepo.findRoleSummary.mockResolvedValue(STUDENT);
    progress.list.mockResolvedValue([buildEntry({ memberId: 'member-1' })]);

    const views = await useCase.execute('caller-user', 'gym-1', 'member-1', {});

    expect(views).toHaveLength(1);
  });
});
