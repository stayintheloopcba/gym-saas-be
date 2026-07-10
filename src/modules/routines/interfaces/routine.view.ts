import { RoutineScope } from '../../../common/enums/routine-scope.enum';
import { RoutineItem } from '../domain/routine-item.entity';
import { Routine } from '../domain/routine.entity';

export interface RoutineItemView {
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
