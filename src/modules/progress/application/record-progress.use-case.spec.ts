import { Member } from '../../members/domain/member.entity';
import { MemberStatus } from '../../members/domain/member-status.enum';
import { MemberNotFoundError } from '../../members/domain/member.errors';
import { MemberRepository } from '../../members/domain/member.repository';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PermissionRepository } from '../../permissions/domain/permission.repository';
import { RoutineItem } from '../../routines/domain/routine-item.entity';
import { RoutineItemRepository } from '../../routines/domain/routine-item.repository';
import { RoutineItemNotFoundError } from '../../routines/domain/routine.errors';
import { ProgressEntry } from '../domain/progress-entry.entity';
import { ProgressOwnerMismatchError } from '../domain/progress.errors';
import { ProgressRepository } from '../domain/progress.repository';
import { RecordProgressUseCase } from './record-progress.use-case';

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

describe('RecordProgressUseCase', () => {
  let progress: jest.Mocked<Pick<ProgressRepository, 'save'>>;
  let members: jest.Mocked<Pick<MemberRepository, 'findById' | 'findByGymAndUserId'>>;
  let routineItems: jest.Mocked<Pick<RoutineItemRepository, 'findById'>>;
  let permissionsRepo: jest.Mocked<Pick<PermissionRepository, 'findRoleSummary'>>;
  let permissions: jest.Mocked<Pick<GymPermissionService, 'requirePermission'>>;
  let useCase: RecordProgressUseCase;

  beforeEach(() => {
    progress = { save: jest.fn((entry: ProgressEntry) => Promise.resolve(entry)) };
    members = {
      findById: jest.fn().mockResolvedValue(buildMember({ id: 'member-2', userId: 'target-user' })),
      findByGymAndUserId: jest.fn().mockResolvedValue(buildMember()),
    };
    routineItems = { findById: jest.fn().mockResolvedValue(Object.assign(new RoutineItem(), { id: 'item-1' })) };
    permissionsRepo = { findRoleSummary: jest.fn().mockResolvedValue(INSTRUCTOR) };
    permissions = { requirePermission: jest.fn().mockResolvedValue(undefined) };
    useCase = new RecordProgressUseCase(
      progress as unknown as ProgressRepository,
      members as unknown as MemberRepository,
      routineItems as unknown as RoutineItemRepository,
      permissionsRepo as unknown as PermissionRepository,
      permissions as unknown as GymPermissionService,
    );
  });

  it('records a progress entry', async () => {
    const view = await useCase.execute({
      callerUserId: 'caller-user',
      gymId: 'gym-1',
      memberId: 'member-2',
      value: 82.5,
      reps: 10,
    });

    expect(view.memberId).toBe('member-2');
    expect(view.value).toBe(82.5);
    expect(view.reps).toBe(10);
  });

  it('throws MemberNotFoundError when the member is missing', async () => {
    members.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ callerUserId: 'caller-user', gymId: 'gym-1', memberId: 'missing', value: 10 }),
    ).rejects.toBeInstanceOf(MemberNotFoundError);
  });

  it('throws RoutineItemNotFoundError when routineItemId does not resolve', async () => {
    routineItems.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        callerUserId: 'caller-user',
        gymId: 'gym-1',
        memberId: 'member-2',
        routineItemId: 'missing',
        value: 10,
      }),
    ).rejects.toBeInstanceOf(RoutineItemNotFoundError);
  });

  it('rejects a student recording progress for someone else', async () => {
    members.findByGymAndUserId.mockResolvedValue(buildMember({ roleId: STUDENT.id }));
    permissionsRepo.findRoleSummary.mockResolvedValue(STUDENT);

    await expect(
      useCase.execute({ callerUserId: 'caller-user', gymId: 'gym-1', memberId: 'member-2', value: 10 }),
    ).rejects.toBeInstanceOf(ProgressOwnerMismatchError);
  });

  it('allows a student recording their own progress', async () => {
    members.findByGymAndUserId.mockResolvedValue(buildMember({ roleId: STUDENT.id }));
    members.findById.mockResolvedValue(buildMember({ roleId: STUDENT.id }));
    permissionsRepo.findRoleSummary.mockResolvedValue(STUDENT);

    const view = await useCase.execute({
      callerUserId: 'caller-user',
      gymId: 'gym-1',
      memberId: 'member-1',
      value: 10,
    });

    expect(view.memberId).toBe('member-1');
  });
});
