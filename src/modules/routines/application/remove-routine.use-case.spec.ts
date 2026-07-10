import { RoutineScope } from '../../../common/enums/routine-scope.enum';
import { Member } from '../../members/domain/member.entity';
import { MemberStatus } from '../../members/domain/member-status.enum';
import { MemberRepository } from '../../members/domain/member.repository';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PermissionRepository } from '../../permissions/domain/permission.repository';
import { Routine } from '../domain/routine.entity';
import { RoutineNotFoundError, RoutineOwnerMismatchError } from '../domain/routine.errors';
import { RoutineRepository } from '../domain/routine.repository';
import { RemoveRoutineUseCase } from './remove-routine.use-case';

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

describe('RemoveRoutineUseCase', () => {
  let routines: jest.Mocked<Pick<RoutineRepository, 'findById' | 'softDelete'>>;
  let members: jest.Mocked<Pick<MemberRepository, 'findByGymAndUserId'>>;
  let permissionsRepo: jest.Mocked<Pick<PermissionRepository, 'findRoleSummary'>>;
  let permissions: jest.Mocked<Pick<GymPermissionService, 'requirePermission'>>;
  let useCase: RemoveRoutineUseCase;

  beforeEach(() => {
    routines = { findById: jest.fn().mockResolvedValue(buildRoutine()), softDelete: jest.fn() };
    members = { findByGymAndUserId: jest.fn().mockResolvedValue(buildMember()) };
    permissionsRepo = { findRoleSummary: jest.fn().mockResolvedValue(INSTRUCTOR) };
    permissions = { requirePermission: jest.fn().mockResolvedValue(undefined) };
    useCase = new RemoveRoutineUseCase(
      routines as unknown as RoutineRepository,
      members as unknown as MemberRepository,
      permissionsRepo as unknown as PermissionRepository,
      permissions as unknown as GymPermissionService,
    );
  });

  it('soft-deletes an existing routine', async () => {
    await useCase.execute('caller-user', 'gym-1', 'routine-1');

    expect(routines.softDelete).toHaveBeenCalledWith('routine-1');
  });

  it('throws RoutineNotFoundError when missing', async () => {
    routines.findById.mockResolvedValue(null);

    await expect(useCase.execute('caller-user', 'gym-1', 'missing')).rejects.toBeInstanceOf(RoutineNotFoundError);
    expect(routines.softDelete).not.toHaveBeenCalled();
  });

  it('rejects a student removing a TEMPLATE routine', async () => {
    members.findByGymAndUserId.mockResolvedValue(buildMember({ roleId: STUDENT.id }));
    permissionsRepo.findRoleSummary.mockResolvedValue(STUDENT);

    await expect(useCase.execute('caller-user', 'gym-1', 'routine-1')).rejects.toBeInstanceOf(
      RoutineOwnerMismatchError,
    );
    expect(routines.softDelete).not.toHaveBeenCalled();
  });

  it('allows a student removing their own PERSONAL routine', async () => {
    routines.findById.mockResolvedValue(buildRoutine({ scope: RoutineScope.PERSONAL, ownerMemberId: 'member-1' }));
    members.findByGymAndUserId.mockResolvedValue(buildMember({ roleId: STUDENT.id }));
    permissionsRepo.findRoleSummary.mockResolvedValue(STUDENT);

    await useCase.execute('caller-user', 'gym-1', 'routine-1');

    expect(routines.softDelete).toHaveBeenCalledWith('routine-1');
  });
});
