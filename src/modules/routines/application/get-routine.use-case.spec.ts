import { RoutineScope } from '../../../common/enums/routine-scope.enum';
import { Member } from '../../members/domain/member.entity';
import { MemberStatus } from '../../members/domain/member-status.enum';
import { MemberRepository } from '../../members/domain/member.repository';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PermissionRepository } from '../../permissions/domain/permission.repository';
import { RoutineItemRepository } from '../domain/routine-item.repository';
import { Routine } from '../domain/routine.entity';
import { RoutineNotFoundError } from '../domain/routine.errors';
import { RoutineRepository } from '../domain/routine.repository';
import { GetRoutineUseCase } from './get-routine.use-case';

const STUDENT = { id: 'role-student', key: 'student', name: 'Alumno' };
const INSTRUCTOR = { id: 'role-instructor', key: 'instructor', name: 'Instructor' };

const buildMember = (overrides: Partial<Member> = {}): Member =>
  Object.assign(new Member(), {
    id: 'member-1',
    gymId: 'gym-1',
    userId: 'caller-user',
    roleId: INSTRUCTOR.id,
    status: MemberStatus.ACTIVE,
    ...overrides,
  });

const buildRoutine = (overrides: Partial<Routine> = {}): Routine =>
  Object.assign(new Routine(), {
    id: 'routine-1',
    gymId: 'gym-1',
    scope: RoutineScope.TEMPLATE,
    ownerMemberId: null,
    createdByMemberId: 'member-2',
    name: 'Push day',
    notes: null,
    active: true,
    ...overrides,
  });

describe('GetRoutineUseCase', () => {
  let routines: jest.Mocked<Pick<RoutineRepository, 'findById'>>;
  let routineItems: jest.Mocked<Pick<RoutineItemRepository, 'listByRoutine'>>;
  let members: jest.Mocked<Pick<MemberRepository, 'findByGymAndUserId'>>;
  let permissionsRepo: jest.Mocked<Pick<PermissionRepository, 'findRoleSummary'>>;
  let permissions: jest.Mocked<Pick<GymPermissionService, 'requirePermission'>>;
  let useCase: GetRoutineUseCase;

  beforeEach(() => {
    routines = { findById: jest.fn() };
    routineItems = { listByRoutine: jest.fn().mockResolvedValue([]) };
    members = { findByGymAndUserId: jest.fn().mockResolvedValue(buildMember()) };
    permissionsRepo = { findRoleSummary: jest.fn().mockResolvedValue(INSTRUCTOR) };
    permissions = { requirePermission: jest.fn().mockResolvedValue(undefined) };
    useCase = new GetRoutineUseCase(
      routines as unknown as RoutineRepository,
      routineItems as unknown as RoutineItemRepository,
      members as unknown as MemberRepository,
      permissionsRepo as unknown as PermissionRepository,
      permissions as unknown as GymPermissionService,
    );
  });

  it('returns a routine by id', async () => {
    routines.findById.mockResolvedValue(buildRoutine());

    const view = await useCase.execute('caller-user', 'gym-1', 'routine-1');

    expect(view.id).toBe('routine-1');
  });

  it('throws RoutineNotFoundError when missing', async () => {
    routines.findById.mockResolvedValue(null);

    await expect(useCase.execute('caller-user', 'gym-1', 'missing')).rejects.toBeInstanceOf(RoutineNotFoundError);
  });

  it('allows a student to read a TEMPLATE routine', async () => {
    members.findByGymAndUserId.mockResolvedValue(buildMember({ roleId: STUDENT.id }));
    permissionsRepo.findRoleSummary.mockResolvedValue(STUDENT);
    routines.findById.mockResolvedValue(buildRoutine());

    const view = await useCase.execute('caller-user', 'gym-1', 'routine-1');

    expect(view.scope).toBe(RoutineScope.TEMPLATE);
  });

  it('allows a student to read their own PERSONAL routine', async () => {
    members.findByGymAndUserId.mockResolvedValue(buildMember({ roleId: STUDENT.id }));
    permissionsRepo.findRoleSummary.mockResolvedValue(STUDENT);
    routines.findById.mockResolvedValue(buildRoutine({ scope: RoutineScope.PERSONAL, ownerMemberId: 'member-1' }));

    const view = await useCase.execute('caller-user', 'gym-1', 'routine-1');

    expect(view.ownerMemberId).toBe('member-1');
  });

  it('hides another member PERSONAL routine from a student as not-found', async () => {
    members.findByGymAndUserId.mockResolvedValue(buildMember({ roleId: STUDENT.id }));
    permissionsRepo.findRoleSummary.mockResolvedValue(STUDENT);
    routines.findById.mockResolvedValue(buildRoutine({ scope: RoutineScope.PERSONAL, ownerMemberId: 'member-2' }));

    await expect(useCase.execute('caller-user', 'gym-1', 'routine-1')).rejects.toBeInstanceOf(RoutineNotFoundError);
  });
});
