import { PlanDiscipline } from './plan-discipline.entity';

export const PLAN_DISCIPLINE_REPOSITORY = Symbol('PLAN_DISCIPLINE_REPOSITORY');

export interface PlanDisciplineRepository {
  listByPlan(planId: string): Promise<PlanDiscipline[]>;
  /** Reemplaza por completo el set de disciplinas incluidas en el plan. */
  replaceSet(gymId: string, planId: string, disciplineIds: string[]): Promise<PlanDiscipline[]>;
}
