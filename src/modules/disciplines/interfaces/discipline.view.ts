import { Discipline } from '../domain/discipline.entity';

export interface DisciplineView {
  id: string;
  code: string;
  name: string;
  active: boolean;
}

export function toDisciplineView(discipline: Discipline): DisciplineView {
  return { id: discipline.id, code: discipline.code, name: discipline.name, active: discipline.active };
}
