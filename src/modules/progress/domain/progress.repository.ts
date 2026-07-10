import { ProgressEntry } from './progress-entry.entity';

export const PROGRESS_REPOSITORY = Symbol('PROGRESS_REPOSITORY');

export interface ProgressListFilters {
  routineItemId?: string;
  from?: string;
  to?: string;
}

export interface ProgressRepository {
  list(gymId: string, memberId: string, filters: ProgressListFilters): Promise<ProgressEntry[]>;
  save(entry: ProgressEntry): Promise<ProgressEntry>;
}
