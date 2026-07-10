import { RoutineScope } from '../../../common/enums/routine-scope.enum';
import { RoutineAssignment } from '../domain/routine-assignment.entity';
import { RoutineItem } from '../domain/routine-item.entity';
import { Routine } from '../domain/routine.entity';

export interface RoutineItemView {
  id: string;
  routineId: string;
  exerciseName: string;
  sets: number;
  reps: string;
  notes: string | null;
  order: number;
}

export interface RoutineView {
  id: string;
  gymId: string;
  scope: RoutineScope;
  ownerMemberId: string | null;
  createdByMemberId: string | null;
  name: string;
  notes: string | null;
  active: boolean;
  items: RoutineItemView[];
  createdAt: Date;
}

export function toRoutineItemView(item: RoutineItem): RoutineItemView {
  return {
    id: item.id,
    routineId: item.routineId,
    exerciseName: item.exerciseName,
    sets: item.sets,
    reps: item.reps,
    notes: item.notes,
    order: item.order,
  };
}

export function toRoutineView(routine: Routine, items: RoutineItem[]): RoutineView {
  return {
    id: routine.id,
    gymId: routine.gymId,
    scope: routine.scope,
    ownerMemberId: routine.ownerMemberId,
    createdByMemberId: routine.createdByMemberId,
    name: routine.name,
    notes: routine.notes,
    active: routine.active,
    items: items.map(toRoutineItemView),
    createdAt: routine.createdAt,
  };
}

export interface AssignmentView {
  id: string;
  gymId: string;
  memberId: string;
  routineId: string;
  assignedByMemberId: string | null;
  assignedAt: Date;
  unassignedAt: Date | null;
}

export function toAssignmentView(assignment: RoutineAssignment): AssignmentView {
  return {
    id: assignment.id,
    gymId: assignment.gymId,
    memberId: assignment.memberId,
    routineId: assignment.routineId,
    assignedByMemberId: assignment.assignedByMemberId,
    assignedAt: assignment.assignedAt,
    unassignedAt: assignment.unassignedAt,
  };
}

export interface MemberRoutineView extends AssignmentView {
  routine: RoutineView;
}

export function toMemberRoutineView(assignment: RoutineAssignment, routine: RoutineView): MemberRoutineView {
  return { ...toAssignmentView(assignment), routine };
}
