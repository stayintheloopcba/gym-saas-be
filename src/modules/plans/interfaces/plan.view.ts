import { Periodicity } from '../../../common/enums/periodicity.enum';
import { Plan } from '../domain/plan.entity';

export interface PlanView {
  id: string;
  gymId: string;
  name: string;
  price: number;
  currency: string;
  periodicity: Periodicity;
  visitsPerMonth: number | null;
  timeWindow: Record<string, unknown> | null;
  active: boolean;
  branchIds: string[];
  disciplineIds: string[];
  createdAt: Date;
}

export function toPlanView(plan: Plan, branchIds: string[], disciplineIds: string[]): PlanView {
  return {
    id: plan.id,
    gymId: plan.gymId,
    name: plan.name,
    price: Number(plan.price),
    currency: plan.currency,
    periodicity: plan.periodicity,
    visitsPerMonth: plan.visitsPerMonth,
    timeWindow: plan.timeWindow,
    active: plan.active,
    branchIds,
    disciplineIds,
    createdAt: plan.createdAt,
  };
}
