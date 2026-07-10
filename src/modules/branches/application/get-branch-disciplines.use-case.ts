import { Inject, Injectable } from '@nestjs/common';
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

@Injectable()
export class GetBranchDisciplinesUseCase {
  constructor(
    @Inject(BRANCH_REPOSITORY) private readonly branches: BranchRepository,
    @Inject(BRANCH_DISCIPLINE_REPOSITORY) private readonly branchDisciplines: BranchDisciplineRepository,
    @Inject(DISCIPLINE_REPOSITORY) private readonly disciplines: DisciplineRepository,
    private readonly permissions: GymPermissionService,
  ) {}

  async execute(callerUserId: string, gymId: string, branchId: string): Promise<DisciplineView[]> {
    await this.permissions.requirePermission(callerUserId, gymId, PERMISSIONS.BRANCHES_READ);

    const branch = await this.branches.findById(gymId, branchId);
    if (!branch) {
      throw new BranchNotFoundError(branchId);
    }

    const offered = await this.branchDisciplines.listByBranch(branchId);
    const views: DisciplineView[] = [];
    for (const row of offered.filter((r) => r.active)) {
      const discipline = await this.disciplines.findById(row.disciplineId);
      if (discipline) {
        views.push(toDisciplineView(discipline));
      }
    }
    return views;
  }
}
