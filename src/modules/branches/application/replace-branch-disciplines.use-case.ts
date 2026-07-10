import { Inject, Injectable } from '@nestjs/common';
import { DisciplineNotFoundError } from '../../disciplines/domain/discipline.errors';
import { DISCIPLINE_REPOSITORY } from '../../disciplines/domain/discipline.repository';
import type { DisciplineRepository } from '../../disciplines/domain/discipline.repository';
import { DisciplineView, toDisciplineView } from '../../disciplines/interfaces/discipline.view';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { BranchNotFoundError } from '../domain/branch.errors';
import { BRANCH_DISCIPLINE_REPOSITORY } from '../domain/branch-discipline.repository';
import type { BranchDisciplineRepository } from '../domain/branch-discipline.repository';
import { BRANCH_REPOSITORY } from '../domain/branch.repository';
import type { BranchRepository } from '../domain/branch.repository';

/** Reemplaza el set completo de disciplinas ofrecidas por una sede. */
@Injectable()
export class ReplaceBranchDisciplinesUseCase {
  constructor(
    @Inject(BRANCH_REPOSITORY) private readonly branches: BranchRepository,
    @Inject(BRANCH_DISCIPLINE_REPOSITORY) private readonly branchDisciplines: BranchDisciplineRepository,
    @Inject(DISCIPLINE_REPOSITORY) private readonly disciplines: DisciplineRepository,
    private readonly permissions: GymPermissionService,
  ) {}

  async execute(
    callerUserId: string,
    gymId: string,
    branchId: string,
    disciplineIds: string[],
  ): Promise<DisciplineView[]> {
    await this.permissions.requirePermission(callerUserId, gymId, PERMISSIONS.BRANCHES_MANAGE);

    const branch = await this.branches.findById(gymId, branchId);
    if (!branch) {
      throw new BranchNotFoundError(branchId);
    }

    const uniqueIds = [...new Set(disciplineIds)];
    const views: DisciplineView[] = [];
    for (const disciplineId of uniqueIds) {
      const discipline = await this.disciplines.findById(disciplineId);
      if (!discipline) {
        throw new DisciplineNotFoundError(disciplineId);
      }
      views.push(toDisciplineView(discipline));
    }

    await this.branchDisciplines.replaceSet(gymId, branchId, uniqueIds);
    return views;
  }
}
