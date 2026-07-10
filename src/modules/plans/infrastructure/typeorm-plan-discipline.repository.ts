import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanDiscipline } from '../domain/plan-discipline.entity';
import { PlanDisciplineRepository } from '../domain/plan-discipline.repository';

@Injectable()
export class TypeOrmPlanDisciplineRepository implements PlanDisciplineRepository {
  constructor(@InjectRepository(PlanDiscipline) private readonly repo: Repository<PlanDiscipline>) {}

  listByPlan(planId: string): Promise<PlanDiscipline[]> {
    return this.repo.find({ where: { planId } });
  }

  async replaceSet(gymId: string, planId: string, disciplineIds: string[]): Promise<PlanDiscipline[]> {
    await this.repo.softDelete({ planId });

    const rows = disciplineIds.map((disciplineId) => this.repo.create({ gymId, planId, disciplineId }));
    if (rows.length === 0) {
      return [];
    }
    return this.repo.save(rows);
  }
}
