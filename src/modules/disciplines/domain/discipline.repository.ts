import { Discipline } from './discipline.entity';

export const DISCIPLINE_REPOSITORY = Symbol('DISCIPLINE_REPOSITORY');

/** Port de persistencia del catálogo global de `Discipline`. */
export interface DisciplineRepository {
  findById(id: string): Promise<Discipline | null>;
  findByCode(code: string): Promise<Discipline | null>;
  listActive(): Promise<Discipline[]>;
  save(discipline: Discipline): Promise<Discipline>;
}
