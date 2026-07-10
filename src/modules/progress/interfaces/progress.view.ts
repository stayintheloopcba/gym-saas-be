import { ProgressEntry } from '../domain/progress-entry.entity';

export interface ProgressEntryView {
  id: string;
  gymId: string;
  memberId: string;
  routineItemId: string | null;
  value: number;
  reps: number | null;
  recordedAt: Date;
}

export function toProgressEntryView(entry: ProgressEntry): ProgressEntryView {
  return {
    id: entry.id,
    gymId: entry.gymId,
    memberId: entry.memberId,
    routineItemId: entry.routineItemId,
    value: entry.value,
    reps: entry.reps,
    recordedAt: entry.recordedAt,
  };
}
