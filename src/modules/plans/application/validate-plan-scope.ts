import { Inject, Injectable } from '@nestjs/common';
import { BRANCH_DISCIPLINE_REPOSITORY } from '../../branches/domain/branch-discipline.repository';
import type { BranchDisciplineRepository } from '../../branches/domain/branch-discipline.repository';
import { BranchNotFoundError } from '../../branches/domain/branch.errors';
import { BRANCH_REPOSITORY } from '../../branches/domain/branch.repository';
import type { BranchRepository } from '../../branches/domain/branch.repository';
import { DisciplineNotFoundError } from '../../disciplines/domain/discipline.errors';
import { DISCIPLINE_REPOSITORY } from '../../disciplines/domain/discipline.repository';
import type { DisciplineRepository } from '../../disciplines/domain/discipline.repository';
import { DisciplineNotOfferedError, PlanWithoutBranchesError } from '../domain/plan.errors';

/**
 * Valida la selección de sedes/disciplinas de un `Plan` antes de escribir los
 * joins: al menos una sede, sedes/disciplinas existentes, y cada disciplina
 * ofrecida (activa) en todas las sedes del plan.
 */
@Injectable()
export class ValidatePlanScope {
  constructor(
    @Inject(BRANCH_REPOSITORY) private readonly branches: BranchRepository,
    @Inject(DISCIPLINE_REPOSITORY) private readonly disciplines: DisciplineRepository,
    @Inject(BRANCH_DISCIPLINE_REPOSITORY) private readonly branchDisciplines: BranchDisciplineRepository,
  ) {}

  async execute(gymId: string, branchIds: string[], disciplineIds: string[]): Promise<void> {
    if (branchIds.length === 0) {
      throw new PlanWithoutBranchesError();
    }

    for (const branchId of branchIds) {
      const branch = await this.branches.findById(gymId, branchId);
      if (!branch) {
        throw new BranchNotFoundError(branchId);
      }
    }

    for (const disciplineId of disciplineIds) {
      const discipline = await this.disciplines.findById(disciplineId);
      if (!discipline) {
        throw new DisciplineNotFoundError(disciplineId);
      }
      for (const branchId of branchIds) {
        const offered = await this.branchDisciplines.isOffered(branchId, disciplineId);
        if (!offered) {
          throw new DisciplineNotOfferedError(disciplineId, branchId);
        }
      }
    }
  }
}
