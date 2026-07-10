import { RoutineAssignment } from './routine-assignment.entity';

export const ROUTINE_ASSIGNMENT_REPOSITORY = Symbol('ROUTINE_ASSIGNMENT_REPOSITORY');

export interface RoutineAssignmentRepository {
  findById(gymId: string, id: string): Promise<RoutineAssignment | null>;
  /** La asignación activa (`unassignedAt IS NULL`) de ese member para esa rutina, si existe. */
  findActive(gymId: string, memberId: string, routineId: string): Promise<RoutineAssignment | null>;
  /** Todas las asignaciones activas de un member. */
  listActiveByMember(gymId: string, memberId: string): Promise<RoutineAssignment[]>;
  save(assignment: RoutineAssignment): Promise<RoutineAssignment>;
}
