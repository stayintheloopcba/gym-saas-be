import { RoutineItem } from './routine-item.entity';

export const ROUTINE_ITEM_REPOSITORY = Symbol('ROUTINE_ITEM_REPOSITORY');

export interface RoutineItemInput {
  exerciseName: string;
  sets: number;
  reps: string;
  notes?: string | null;
  order: number;
}

export interface RoutineItemRepository {
  findById(gymId: string, id: string): Promise<RoutineItem | null>;
  listByRoutine(routineId: string): Promise<RoutineItem[]>;
  /** Reemplaza por completo los items de la rutina (orden incluido). */
  replaceSet(gymId: string, routineId: string, items: RoutineItemInput[]): Promise<RoutineItem[]>;
}
