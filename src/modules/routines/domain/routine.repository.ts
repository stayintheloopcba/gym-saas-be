import { Routine } from './routine.entity';

export const ROUTINE_REPOSITORY = Symbol('ROUTINE_REPOSITORY');

export interface RoutineRepository {
  findById(gymId: string, id: string): Promise<Routine | null>;
  listByGym(gymId: string): Promise<Routine[]>;
  save(routine: Routine): Promise<Routine>;
  softDelete(id: string): Promise<void>;
}
