import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BranchDiscipline } from '../domain/branch-discipline.entity';
import { BranchDisciplineRepository } from '../domain/branch-discipline.repository';

@Injectable()
export class TypeOrmBranchDisciplineRepository implements BranchDisciplineRepository {
  constructor(@InjectRepository(BranchDiscipline) private readonly repo: Repository<BranchDiscipline>) {}

  listByBranch(branchId: string): Promise<BranchDiscipline[]> {
    return this.repo.find({ where: { branchId } });
  }

  async replaceSet(gymId: string, branchId: string, disciplineIds: string[]): Promise<BranchDiscipline[]> {
    await this.repo.softDelete({ branchId });

    const rows = disciplineIds.map((disciplineId) => this.repo.create({ gymId, branchId, disciplineId, active: true }));
    if (rows.length === 0) {
      return [];
    }
    return this.repo.save(rows);
  }

  async isOffered(branchId: string, disciplineId: string): Promise<boolean> {
    const count = await this.repo.count({ where: { branchId, disciplineId, active: true } });
    return count > 0;
  }
}
