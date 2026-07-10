import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanBranch } from '../domain/plan-branch.entity';
import { PlanBranchRepository } from '../domain/plan-branch.repository';

@Injectable()
export class TypeOrmPlanBranchRepository implements PlanBranchRepository {
  constructor(@InjectRepository(PlanBranch) private readonly repo: Repository<PlanBranch>) {}

  listByPlan(planId: string): Promise<PlanBranch[]> {
    return this.repo.find({ where: { planId } });
  }

  async replaceSet(gymId: string, planId: string, branchIds: string[]): Promise<PlanBranch[]> {
    await this.repo.softDelete({ planId });

    const rows = branchIds.map((branchId) => this.repo.create({ gymId, planId, branchId }));
    if (rows.length === 0) {
      return [];
    }
    return this.repo.save(rows);
  }
}
