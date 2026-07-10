import { RoutineScope } from '../../../common/enums/routine-scope.enum';
import { Member } from '../../members/domain/member.entity';
import { MemberStatus } from '../../members/domain/member-status.enum';
import { MemberRepository } from '../../members/domain/member.repository';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PermissionRepository } from '../../permissions/domain/permission.repository';
import { RoutineItem } from '../domain/routine-item.entity';
import { RoutineItemRepository } from '../domain/routine-item.repository';
import { Routine } from '../domain/routine.entity';
import { RoutineNotFoundError, RoutineOwnerMismatchError } from '../domain/routine.errors';
import { RoutineRepository } from '../domain/routine.repository';
import { UpdateRoutineUseCase } from './update-routine.use-case';

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

describe('UpdateRoutineUseCase', () => {
  let routines: jest.Mocked<Pick<RoutineRepository, 'findById' | 'save'>>;
  let routineItems: jest.Mocked<Pick<RoutineItemRepository, 'listByRoutine' | 'replaceSet'>>;
  let members: jest.Mocked<Pick<MemberRepository, 'findByGymAndUserId'>>;
  let permissionsRepo: jest.Mocked<Pick<PermissionRepository, 'findRoleSummary'>>;
  let permissions: jest.Mocked<Pick<GymPermissionService, 'requirePermission'>>;
  let useCase: UpdateRoutineUseCase;

  beforeEach(() => {
    routines = {
      findById: jest.fn().mockResolvedValue(buildRoutine()),
      save: jest.fn((routine: Routine) => Promise.resolve(routine)),
    };
    routineItems = {
      listByRoutine: jest.fn().mockResolvedValue([]),
      replaceSet: jest.fn().mockResolvedValue([Object.assign(new RoutineItem(), { id: 'item-1' })]),
    };
    members = { findByGymAndUserId: jest.fn().mockResolvedValue(buildMember()) };
    permissionsRepo = { findRoleSummary: jest.fn().mockResolvedValue(INSTRUCTOR) };
    permissions = { requirePermission: jest.fn().mockResolvedValue(undefined) };
    useCase = new UpdateRoutineUseCase(
      routines as unknown as RoutineRepository,
      routineItems as unknown as RoutineItemRepository,
      members as unknown as MemberRepository,
      permissionsRepo as unknown as PermissionRepository,
      permissions as unknown as GymPermissionService,
    );
  });

  it('updates name/notes/active', async () => {
    const view = await useCase.execute({
      callerUserId: 'caller-user',
      gymId: 'gym-1',
      routineId: 'routine-1',
      name: 'New name',
      active: false,
    });

    expect(view.name).toBe('New name');
    expect(view.active).toBe(false);
    expect(routineItems.replaceSet).not.toHaveBeenCalled();
  });

  it('replaces items when provided', async () => {
    await useCase.execute({
      callerUserId: 'caller-user',
      gymId: 'gym-1',
      routineId: 'routine-1',
      items: [{ exerciseName: 'Deadlift', sets: 3, reps: '5', order: 0 }],
    });

    expect(routineItems.replaceSet).toHaveBeenCalledWith('gym-1', 'routine-1', [
      { exerciseName: 'Deadlift', sets: 3, reps: '5', order: 0 },
    ]);
  });

  it('throws RoutineNotFoundError when missing', async () => {
    routines.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ callerUserId: 'caller-user', gymId: 'gym-1', routineId: 'missing' }),
    ).rejects.toBeInstanceOf(RoutineNotFoundError);
  });

  it('rejects a student updating a TEMPLATE routine', async () => {
    members.findByGymAndUserId.mockResolvedValue(buildMember({ roleId: STUDENT.id }));
    permissionsRepo.findRoleSummary.mockResolvedValue(STUDENT);

    await expect(
      useCase.execute({ callerUserId: 'caller-user', gymId: 'gym-1', routineId: 'routine-1', name: 'x' }),
    ).rejects.toBeInstanceOf(RoutineOwnerMismatchError);
  });

  it('rejects a student updating another PERSONAL routine', async () => {
    routines.findById.mockResolvedValue(buildRoutine({ scope: RoutineScope.PERSONAL, ownerMemberId: 'member-2' }));
    members.findByGymAndUserId.mockResolvedValue(buildMember({ roleId: STUDENT.id }));
    permissionsRepo.findRoleSummary.mockResolvedValue(STUDENT);

    await expect(
      useCase.execute({ callerUserId: 'caller-user', gymId: 'gym-1', routineId: 'routine-1', name: 'x' }),
    ).rejects.toBeInstanceOf(RoutineOwnerMismatchError);
  });

  it('allows a student updating their own PERSONAL routine', async () => {
    routines.findById.mockResolvedValue(buildRoutine({ scope: RoutineScope.PERSONAL, ownerMemberId: 'member-1' }));
    members.findByGymAndUserId.mockResolvedValue(buildMember({ roleId: STUDENT.id }));
    permissionsRepo.findRoleSummary.mockResolvedValue(STUDENT);

    const view = await useCase.execute({
      callerUserId: 'caller-user',
      gymId: 'gym-1',
      routineId: 'routine-1',
      name: 'x',
    });

    expect(view.name).toBe('x');
  });
});
