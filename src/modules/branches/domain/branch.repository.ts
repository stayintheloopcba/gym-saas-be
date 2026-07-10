import { Branch } from './branch.entity';

export const BRANCH_REPOSITORY = Symbol('BRANCH_REPOSITORY');

/** Port de persistencia del agregado `Branch`. */
export interface BranchRepository {
  findById(gymId: string, id: string): Promise<Branch | null>;
  /** Todas las sedes del gym (incluye inactivas; el filtro es responsabilidad del caller). */
  listByGym(gymId: string): Promise<Branch[]>;
  save(branch: Branch): Promise<Branch>;
  softDelete(id: string): Promise<void>;
}
