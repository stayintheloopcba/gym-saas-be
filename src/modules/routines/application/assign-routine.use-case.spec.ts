import { Member } from '../../members/domain/member.entity';
import { MemberStatus } from '../../members/domain/member-status.enum';
import { MemberNotFoundError } from '../../members/domain/member.errors';
import { MemberRepository } from '../../members/domain/member.repository';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PermissionRepository } from '../../permissions/domain/permission.repository';
import { RoutineAssignment } from '../domain/routine-assignment.entity';
import { RoutineAssignmentRepository } from '../domain/routine-assignment.repository';
import { Routine } from '../domain/routine.entity';
import {
  DuplicateActiveAssignmentError,
  RoutineAssignmentOwnerMismatchError,
  RoutineNotFoundError,
} from '../domain/routine.errors';
import { RoutineRepository } from '../domain/routine.repository';
import { AssignRoutineUseCase } from './assign-routine.use-case';

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

describe('AssignRoutineUseCase', () => {
  let routines: jest.Mocked<Pick<RoutineRepository, 'findById'>>;
  let assignments: jest.Mocked<Pick<RoutineAssignmentRepository, 'findActive' | 'save'>>;
  let members: jest.Mocked<Pick<MemberRepository, 'findById' | 'findByGymAndUserId'>>;
  let permissionsRepo: jest.Mocked<Pick<PermissionRepository, 'findRoleSummary'>>;
  let permissions: jest.Mocked<Pick<GymPermissionService, 'requirePermission'>>;
  let useCase: AssignRoutineUseCase;

  beforeEach(() => {
    routines = { findById: jest.fn().mockResolvedValue(Object.assign(new Routine(), { id: 'routine-1' })) };
    assignments = {
      findActive: jest.fn().mockResolvedValue(null),
      save: jest.fn((assignment: RoutineAssignment) => Promise.resolve(assignment)),
    };
    members = {
      findById: jest.fn().mockResolvedValue(buildMember({ id: 'member-2', userId: 'target-user' })),
      findByGymAndUserId: jest.fn().mockResolvedValue(buildMember()),
    };
    permissionsRepo = { findRoleSummary: jest.fn().mockResolvedValue(INSTRUCTOR) };
    permissions = { requirePermission: jest.fn().mockResolvedValue(undefined) };
    useCase = new AssignRoutineUseCase(
      routines as unknown as RoutineRepository,
      assignments as unknown as RoutineAssignmentRepository,
      members as unknown as MemberRepository,
      permissionsRepo as unknown as PermissionRepository,
      permissions as unknown as GymPermissionService,
    );
  });

  it('assigns a routine to a member', async () => {
    const view = await useCase.execute({
      callerUserId: 'caller-user',
      gymId: 'gym-1',
      routineId: 'routine-1',
      memberId: 'member-2',
    });

    expect(view.memberId).toBe('member-2');
    expect(view.routineId).toBe('routine-1');
    expect(view.assignedByMemberId).toBe('member-1');
    expect(view.unassignedAt).toBeNull();
  });

  it('throws RoutineNotFoundError when the routine is missing', async () => {
    routines.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ callerUserId: 'caller-user', gymId: 'gym-1', routineId: 'missing', memberId: 'member-2' }),
    ).rejects.toBeInstanceOf(RoutineNotFoundError);
  });

  it('throws MemberNotFoundError when the target member is missing', async () => {
    members.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ callerUserId: 'caller-user', gymId: 'gym-1', routineId: 'routine-1', memberId: 'missing' }),
    ).rejects.toBeInstanceOf(MemberNotFoundError);
  });

  it('throws DuplicateActiveAssignmentError when already actively assigned', async () => {
    assignments.findActive.mockResolvedValue(Object.assign(new RoutineAssignment(), { id: 'assignment-1' }));

    await expect(
      useCase.execute({ callerUserId: 'caller-user', gymId: 'gym-1', routineId: 'routine-1', memberId: 'member-2' }),
    ).rejects.toBeInstanceOf(DuplicateActiveAssignmentError);
  });

  it('rejects a student assigning to someone else', async () => {
    members.findByGymAndUserId.mockResolvedValue(buildMember({ roleId: STUDENT.id }));
    permissionsRepo.findRoleSummary.mockResolvedValue(STUDENT);

    await expect(
      useCase.execute({ callerUserId: 'caller-user', gymId: 'gym-1', routineId: 'routine-1', memberId: 'member-2' }),
    ).rejects.toBeInstanceOf(RoutineAssignmentOwnerMismatchError);
  });

  it('allows a student to self-assign', async () => {
    members.findByGymAndUserId.mockResolvedValue(buildMember({ roleId: STUDENT.id }));
    members.findById.mockResolvedValue(buildMember({ roleId: STUDENT.id }));
    permissionsRepo.findRoleSummary.mockResolvedValue(STUDENT);

    const view = await useCase.execute({
      callerUserId: 'caller-user',
      gymId: 'gym-1',
      routineId: 'routine-1',
      memberId: 'member-1',
    });

    expect(view.memberId).toBe('member-1');
  });
});
