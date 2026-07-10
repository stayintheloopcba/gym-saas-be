import { Inject, Injectable } from '@nestjs/common';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { BranchNotFoundError } from '../domain/branch.errors';
import { BRANCH_REPOSITORY } from '../domain/branch.repository';
import type { BranchRepository } from '../domain/branch.repository';

@Injectable()
export class RemoveBranchUseCase {
  constructor(
    @Inject(BRANCH_REPOSITORY) private readonly branches: BranchRepository,
    private readonly permissions: GymPermissionService,
  ) {}

  async execute(callerUserId: string, gymId: string, branchId: string): Promise<void> {
    await this.permissions.requirePermission(callerUserId, gymId, PERMISSIONS.BRANCHES_MANAGE);

    const branch = await this.branches.findById(gymId, branchId);
    if (!branch) {
      throw new BranchNotFoundError(branchId);
    }

    await this.branches.softDelete(branch.id);
  }
}
