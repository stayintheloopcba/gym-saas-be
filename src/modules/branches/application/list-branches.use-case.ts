import { Inject, Injectable } from '@nestjs/common';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { BRANCH_REPOSITORY } from '../domain/branch.repository';
import type { BranchRepository } from '../domain/branch.repository';
import { BranchView, toBranchView } from '../interfaces/branch.view';

@Injectable()
export class ListBranchesUseCase {
  constructor(
    @Inject(BRANCH_REPOSITORY) private readonly branches: BranchRepository,
    private readonly permissions: GymPermissionService,
  ) {}

  async execute(callerUserId: string, gymId: string): Promise<BranchView[]> {
    await this.permissions.requirePermission(callerUserId, gymId, PERMISSIONS.BRANCHES_READ);

    const branches = await this.branches.listByGym(gymId);
    return branches.map(toBranchView);
  }
}
