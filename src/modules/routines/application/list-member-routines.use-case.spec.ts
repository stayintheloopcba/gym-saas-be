import { RoutineScope } from '../../../common/enums/routine-scope.enum';
import { Member } from '../../members/domain/member.entity';
import { MemberStatus } from '../../members/domain/member-status.enum';
import { MemberNotFoundError } from '../../members/domain/member.errors';
import { MemberRepository } from '../../members/domain/member.repository';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PermissionRepository } from '../../permissions/domain/permission.repository';
import { RoutineAssignment } from '../domain/routine-assignment.entity';
import { RoutineAssignmentRepository } from '../domain/routine-assignment.repository';
import { RoutineItemRepository } from '../domain/routine-item.repository';
import { Routine } from '../domain/routine.entity';
import { RoutineRepository } from '../domain/routine.repository';
import { ListMemberRoutinesUseCase } from './list-member-routines.use-case';

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

const buildAssignment = (overrides: Partial<RoutineAssignment> = {}): RoutineAssignment =>
  Object.assign(new RoutineAssignment(), {
    id: 'assignment-1',
    gymId: 'gym-1',
    memberId: 'member-2',
    routineId: 'routine-1',
    assignedByMemberId: 'member-1',
    assignedAt: new Date('2026-01-01T00:00:00Z'),
    unassignedAt: null,
    ...overrides,
  });

const buildRoutine = (overrides: Partial<Routine> = {}): Routine =>
  Object.assign(new Routine(), {
    id: 'routine-1',
    gymId: 'gym-1',
    scope: RoutineScope.TEMPLATE,
    ownerMemberId: null,
    createdByMemberId: 'member-1',
    name: 'Push day',
    notes: null,
    active: true,
    ...overrides,
  });

describe('ListMemberRoutinesUseCase', () => {
  let assignments: jest.Mocked<Pick<RoutineAssignmentRepository, 'listActiveByMember'>>;
  let routines: jest.Mocked<Pick<RoutineRepository, 'findById'>>;
  let routineItems: jest.Mocked<Pick<RoutineItemRepository, 'listByRoutine'>>;
  let members: jest.Mocked<Pick<MemberRepository, 'findByGymAndUserId'>>;
  let permissionsRepo: jest.Mocked<Pick<PermissionRepository, 'findRoleSummary'>>;
  let permissions: jest.Mocked<Pick<GymPermissionService, 'requirePermission'>>;
  let useCase: ListMemberRoutinesUseCase;

  beforeEach(() => {
    assignments = { listActiveByMember: jest.fn().mockResolvedValue([buildAssignment()]) };
    routines = { findById: jest.fn().mockResolvedValue(buildRoutine()) };
    routineItems = { listByRoutine: jest.fn().mockResolvedValue([]) };
    members = { findByGymAndUserId: jest.fn().mockResolvedValue(buildMember()) };
    permissionsRepo = { findRoleSummary: jest.fn().mockResolvedValue(INSTRUCTOR) };
    permissions = { requirePermission: jest.fn().mockResolvedValue(undefined) };
    useCase = new ListMemberRoutinesUseCase(
      assignments as unknown as RoutineAssignmentRepository,
      routines as unknown as RoutineRepository,
      routineItems as unknown as RoutineItemRepository,
      members as unknown as MemberRepository,
      permissionsRepo as unknown as PermissionRepository,
      permissions as unknown as GymPermissionService,
    );
  });

  it('returns active assignments enriched with routine + items', async () => {
    const views = await useCase.execute('caller-user', 'gym-1', 'member-2');

    expect(views).toHaveLength(1);
    expect(views[0].routine.id).toBe('routine-1');
  });

  it('skips assignments whose routine no longer exists', async () => {
    routines.findById.mockResolvedValue(null);

    const views = await useCase.execute('caller-user', 'gym-1', 'member-2');

    expect(views).toEqual([]);
  });

  it('rejects a student listing another member routines as not-found', async () => {
    members.findByGymAndUserId.mockResolvedValue(buildMember({ roleId: STUDENT.id }));
    permissionsRepo.findRoleSummary.mockResolvedValue(STUDENT);

    await expect(useCase.execute('caller-user', 'gym-1', 'member-2')).rejects.toBeInstanceOf(MemberNotFoundError);
  });

  it('allows a student listing their own routines', async () => {
    members.findByGymAndUserId.mockResolvedValue(buildMember({ roleId: STUDENT.id }));
    permissionsRepo.findRoleSummary.mockResolvedValue(STUDENT);
    assignments.listActiveByMember.mockResolvedValue([buildAssignment({ memberId: 'member-1' })]);

    const views = await useCase.execute('caller-user', 'gym-1', 'member-1');

    expect(views).toHaveLength(1);
  });
});
