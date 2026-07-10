import { RoutineScope } from '../../../common/enums/routine-scope.enum';
import { Member } from '../../members/domain/member.entity';
import { MemberStatus } from '../../members/domain/member-status.enum';
import { MemberRepository } from '../../members/domain/member.repository';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PermissionRepository } from '../../permissions/domain/permission.repository';
import { RoutineItemRepository } from '../domain/routine-item.repository';
import { Routine } from '../domain/routine.entity';
import { RoutineRepository } from '../domain/routine.repository';
import { ListRoutinesUseCase } from './list-routines.use-case';

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

describe('ListRoutinesUseCase', () => {
  let routines: jest.Mocked<Pick<RoutineRepository, 'listByGym'>>;
  let routineItems: jest.Mocked<Pick<RoutineItemRepository, 'listByRoutine'>>;
  let members: jest.Mocked<Pick<MemberRepository, 'findByGymAndUserId'>>;
  let permissionsRepo: jest.Mocked<Pick<PermissionRepository, 'findRoleSummary'>>;
  let permissions: jest.Mocked<Pick<GymPermissionService, 'requirePermission'>>;
  let useCase: ListRoutinesUseCase;

  beforeEach(() => {
    routines = {
      listByGym: jest
        .fn()
        .mockResolvedValue([
          buildRoutine({ id: 'template-1', scope: RoutineScope.TEMPLATE, ownerMemberId: null }),
          buildRoutine({ id: 'own-1', scope: RoutineScope.PERSONAL, ownerMemberId: 'member-1' }),
          buildRoutine({ id: 'other-1', scope: RoutineScope.PERSONAL, ownerMemberId: 'member-2' }),
        ]),
    };
    routineItems = { listByRoutine: jest.fn().mockResolvedValue([]) };
    members = { findByGymAndUserId: jest.fn().mockResolvedValue(buildMember()) };
    permissionsRepo = { findRoleSummary: jest.fn().mockResolvedValue(INSTRUCTOR) };
    permissions = { requirePermission: jest.fn().mockResolvedValue(undefined) };
    useCase = new ListRoutinesUseCase(
      routines as unknown as RoutineRepository,
      routineItems as unknown as RoutineItemRepository,
      members as unknown as MemberRepository,
      permissionsRepo as unknown as PermissionRepository,
      permissions as unknown as GymPermissionService,
    );
  });

  it('returns every routine for a non-student caller', async () => {
    const views = await useCase.execute('caller-user', 'gym-1');

    expect(views.map((v) => v.id)).toEqual(['template-1', 'own-1', 'other-1']);
  });

  it('filters to templates and own routines for a student caller', async () => {
    members.findByGymAndUserId.mockResolvedValue(buildMember({ roleId: STUDENT.id }));
    permissionsRepo.findRoleSummary.mockResolvedValue(STUDENT);

    const views = await useCase.execute('caller-user', 'gym-1');

    expect(views.map((v) => v.id)).toEqual(['template-1', 'own-1']);
  });
});
