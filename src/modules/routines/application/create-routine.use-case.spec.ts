import { RoutineScope } from '../../../common/enums/routine-scope.enum';
import { Member } from '../../members/domain/member.entity';
import { MemberStatus } from '../../members/domain/member-status.enum';
import { MemberRepository } from '../../members/domain/member.repository';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PermissionRepository } from '../../permissions/domain/permission.repository';
import { RoutineItem } from '../domain/routine-item.entity';
import { RoutineItemRepository } from '../domain/routine-item.repository';
import { Routine } from '../domain/routine.entity';
import {
  RoutineOwnerMismatchError,
  RoutineOwnerNotAllowedError,
  RoutineOwnerRequiredError,
} from '../domain/routine.errors';
import { RoutineRepository } from '../domain/routine.repository';
import { CreateRoutineUseCase } from './create-routine.use-case';

const INSTRUCTOR = { id: 'role-instructor', key: 'instructor', name: 'Instructor' };
const STUDENT = { id: 'role-student', key: 'student', name: 'Alumno' };

const buildMember = (overrides: Partial<Member> = {}): Member =>
  Object.assign(new Member(), {
    id: 'member-1',
    gymId: 'gym-1',
    userId: 'caller-user',
    roleId: INSTRUCTOR.id,
    firstName: 'Ada',
    lastName: 'Lovelace',
    status: MemberStatus.ACTIVE,
    ...overrides,
  });

const buildItem = (overrides: Partial<RoutineItem> = {}): RoutineItem =>
  Object.assign(new RoutineItem(), {
    id: 'item-1',
    routineId: 'routine-1',
    exerciseName: 'Back squat',
    sets: 4,
    reps: '8-12',
    notes: null,
    order: 0,
    ...overrides,
  });

describe('CreateRoutineUseCase', () => {
  let routines: jest.Mocked<Pick<RoutineRepository, 'save'>>;
  let routineItems: jest.Mocked<Pick<RoutineItemRepository, 'replaceSet'>>;
  let members: jest.Mocked<Pick<MemberRepository, 'findByGymAndUserId'>>;
  let permissionsRepo: jest.Mocked<Pick<PermissionRepository, 'findRoleSummary'>>;
  let permissions: jest.Mocked<Pick<GymPermissionService, 'requirePermission'>>;
  let useCase: CreateRoutineUseCase;

  beforeEach(() => {
    routines = { save: jest.fn((routine: Routine) => Promise.resolve(routine)) };
    routineItems = { replaceSet: jest.fn().mockResolvedValue([buildItem()]) };
    members = { findByGymAndUserId: jest.fn().mockResolvedValue(buildMember()) };
    permissionsRepo = { findRoleSummary: jest.fn().mockResolvedValue(INSTRUCTOR) };
    permissions = { requirePermission: jest.fn().mockResolvedValue(undefined) };
    useCase = new CreateRoutineUseCase(
      routines as unknown as RoutineRepository,
      routineItems as unknown as RoutineItemRepository,
      members as unknown as MemberRepository,
      permissionsRepo as unknown as PermissionRepository,
      permissions as unknown as GymPermissionService,
    );
  });

  it('creates a TEMPLATE routine without an owner', async () => {
    const view = await useCase.execute({
      callerUserId: 'caller-user',
      gymId: 'gym-1',
      scope: RoutineScope.TEMPLATE,
      name: 'Push day',
      items: [{ exerciseName: 'Back squat', sets: 4, reps: '8-12', order: 0 }],
    });

    expect(view.scope).toBe(RoutineScope.TEMPLATE);
    expect(view.ownerMemberId).toBeNull();
    expect(view.createdByMemberId).toBe('member-1');
  });

  it('rejects a TEMPLATE routine with an ownerMemberId', async () => {
    await expect(
      useCase.execute({
        callerUserId: 'caller-user',
        gymId: 'gym-1',
        scope: RoutineScope.TEMPLATE,
        ownerMemberId: 'member-2',
        name: 'Push day',
        items: [],
      }),
    ).rejects.toBeInstanceOf(RoutineOwnerNotAllowedError);
    expect(routines.save).not.toHaveBeenCalled();
  });

  it('requires an ownerMemberId for a PERSONAL routine', async () => {
    await expect(
      useCase.execute({
        callerUserId: 'caller-user',
        gymId: 'gym-1',
        scope: RoutineScope.PERSONAL,
        name: 'Push day',
        items: [],
      }),
    ).rejects.toBeInstanceOf(RoutineOwnerRequiredError);
  });

  it('allows an instructor to create a PERSONAL routine for another member', async () => {
    const view = await useCase.execute({
      callerUserId: 'caller-user',
      gymId: 'gym-1',
      scope: RoutineScope.PERSONAL,
      ownerMemberId: 'member-2',
      name: 'Push day',
      items: [],
    });

    expect(view.ownerMemberId).toBe('member-2');
  });

  it('rejects a student creating a PERSONAL routine for someone else', async () => {
    members.findByGymAndUserId.mockResolvedValue(buildMember({ roleId: STUDENT.id }));
    permissionsRepo.findRoleSummary.mockResolvedValue(STUDENT);

    await expect(
      useCase.execute({
        callerUserId: 'caller-user',
        gymId: 'gym-1',
        scope: RoutineScope.PERSONAL,
        ownerMemberId: 'member-2',
        name: 'Push day',
        items: [],
      }),
    ).rejects.toBeInstanceOf(RoutineOwnerMismatchError);
  });

  it('allows a student creating a PERSONAL routine for themselves', async () => {
    members.findByGymAndUserId.mockResolvedValue(buildMember({ roleId: STUDENT.id }));
    permissionsRepo.findRoleSummary.mockResolvedValue(STUDENT);

    const view = await useCase.execute({
      callerUserId: 'caller-user',
      gymId: 'gym-1',
      scope: RoutineScope.PERSONAL,
      ownerMemberId: 'member-1',
      name: 'Push day',
      items: [],
    });

    expect(view.name).toBe('Push day');
  });
});
