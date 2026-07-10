import { Member } from '../../members/domain/member.entity';
import { MemberStatus } from '../../members/domain/member-status.enum';
import { MemberRepository } from '../../members/domain/member.repository';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PermissionRepository } from '../../permissions/domain/permission.repository';
import { RoutineAssignment } from '../domain/routine-assignment.entity';
import { RoutineAssignmentRepository } from '../domain/routine-assignment.repository';
import { RoutineAssignmentNotFoundError, RoutineAssignmentOwnerMismatchError } from '../domain/routine.errors';
import { UnassignRoutineUseCase } from './unassign-routine.use-case';

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

describe('UnassignRoutineUseCase', () => {
  let assignments: jest.Mocked<Pick<RoutineAssignmentRepository, 'findById' | 'save'>>;
  let members: jest.Mocked<Pick<MemberRepository, 'findByGymAndUserId'>>;
  let permissionsRepo: jest.Mocked<Pick<PermissionRepository, 'findRoleSummary'>>;
  let permissions: jest.Mocked<Pick<GymPermissionService, 'requirePermission'>>;
  let useCase: UnassignRoutineUseCase;

  beforeEach(() => {
    assignments = {
      findById: jest.fn().mockResolvedValue(buildAssignment()),
      save: jest.fn((assignment: RoutineAssignment) => Promise.resolve(assignment)),
    };
    members = { findByGymAndUserId: jest.fn().mockResolvedValue(buildMember()) };
    permissionsRepo = { findRoleSummary: jest.fn().mockResolvedValue(INSTRUCTOR) };
    permissions = { requirePermission: jest.fn().mockResolvedValue(undefined) };
    useCase = new UnassignRoutineUseCase(
      assignments as unknown as RoutineAssignmentRepository,
      members as unknown as MemberRepository,
      permissionsRepo as unknown as PermissionRepository,
      permissions as unknown as GymPermissionService,
    );
  });

  it('sets unassignedAt', async () => {
    const view = await useCase.execute('caller-user', 'gym-1', 'assignment-1');

    expect(view.unassignedAt).toBeInstanceOf(Date);
  });

  it('throws RoutineAssignmentNotFoundError when missing', async () => {
    assignments.findById.mockResolvedValue(null);

    await expect(useCase.execute('caller-user', 'gym-1', 'missing')).rejects.toBeInstanceOf(
      RoutineAssignmentNotFoundError,
    );
  });

  it('rejects a student unassigning someone else', async () => {
    members.findByGymAndUserId.mockResolvedValue(buildMember({ roleId: STUDENT.id }));
    permissionsRepo.findRoleSummary.mockResolvedValue(STUDENT);

    await expect(useCase.execute('caller-user', 'gym-1', 'assignment-1')).rejects.toBeInstanceOf(
      RoutineAssignmentOwnerMismatchError,
    );
  });

  it('allows a student unassigning their own assignment', async () => {
    assignments.findById.mockResolvedValue(buildAssignment({ memberId: 'member-1' }));
    members.findByGymAndUserId.mockResolvedValue(buildMember({ roleId: STUDENT.id }));
    permissionsRepo.findRoleSummary.mockResolvedValue(STUDENT);

    const view = await useCase.execute('caller-user', 'gym-1', 'assignment-1');

    expect(view.unassignedAt).toBeInstanceOf(Date);
  });

  it('is idempotent when already unassigned', async () => {
    const alreadyUnassignedAt = new Date('2026-02-01T00:00:00Z');
    assignments.findById.mockResolvedValue(buildAssignment({ unassignedAt: alreadyUnassignedAt }));

    const view = await useCase.execute('caller-user', 'gym-1', 'assignment-1');

    expect(view.unassignedAt).toEqual(alreadyUnassignedAt);
  });
});
