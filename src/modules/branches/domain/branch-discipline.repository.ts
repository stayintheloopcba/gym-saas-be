import { BranchDiscipline } from './branch-discipline.entity';

export const BRANCH_DISCIPLINE_REPOSITORY = Symbol('BRANCH_DISCIPLINE_REPOSITORY');

/** Port de persistencia de la oferta de disciplinas por sede (M:N). */
export interface BranchDisciplineRepository {
  listByBranch(branchId: string): Promise<BranchDiscipline[]>;
  /** Reemplaza por completo el set ofrecido por la sede (borra lo que sobra, crea lo que falta). */
  replaceSet(gymId: string, branchId: string, disciplineIds: string[]): Promise<BranchDiscipline[]>;
  /** `true` si la disciplina está activa en esa sede. Usado por `plans` para validar inclusión. */
  isOffered(branchId: string, disciplineId: string): Promise<boolean>;
}
