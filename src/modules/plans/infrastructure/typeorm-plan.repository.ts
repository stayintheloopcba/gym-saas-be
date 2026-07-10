import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from '../domain/plan.entity';
import { PlanRepository } from '../domain/plan.repository';

@Injectable()
export class TypeOrmPlanRepository implements PlanRepository {
  constructor(@InjectRepository(Plan) private readonly repo: Repository<Plan>) {}

  findById(gymId: string, id: string): Promise<Plan | null> {
    return this.repo.findOne({ where: { id, gymId } });
  }

  listByGym(gymId: string): Promise<Plan[]> {
    return this.repo.find({ where: { gymId }, order: { name: 'ASC' } });
  }

  save(plan: Plan): Promise<Plan> {
    return this.repo.save(plan);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
