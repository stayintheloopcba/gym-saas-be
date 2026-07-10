import { Plan } from './plan.entity';

export const PLAN_REPOSITORY = Symbol('PLAN_REPOSITORY');

export interface PlanRepository {
  findById(gymId: string, id: string): Promise<Plan | null>;
  listByGym(gymId: string): Promise<Plan[]>;
  save(plan: Plan): Promise<Plan>;
  softDelete(id: string): Promise<void>;
}
