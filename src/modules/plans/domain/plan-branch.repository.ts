import { PlanBranch } from './plan-branch.entity';

export const PLAN_BRANCH_REPOSITORY = Symbol('PLAN_BRANCH_REPOSITORY');

export interface PlanBranchRepository {
  listByPlan(planId: string): Promise<PlanBranch[]>;
  /** Reemplaza por completo el set de sedes habilitadas para el plan. */
  replaceSet(gymId: string, planId: string, branchIds: string[]): Promise<PlanBranch[]>;
}
