import { Inject, Injectable } from '@nestjs/common';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { BranchNotFoundError } from '../domain/branch.errors';
import { BRANCH_REPOSITORY } from '../domain/branch.repository';
import type { BranchRepository } from '../domain/branch.repository';
import { BranchView, toBranchView } from '../interfaces/branch.view';

export interface UpdateBranchCommand {
  callerUserId: string;
  gymId: string;
  branchId: string;
  name?: string;
  address?: string;
  phone?: string;
  openingHours?: Record<string, unknown>;
  capacity?: number;
  active?: boolean;
}

@Injectable()
export class UpdateBranchUseCase {
  constructor(
    @Inject(BRANCH_REPOSITORY) private readonly branches: BranchRepository,
    private readonly permissions: GymPermissionService,
  ) {}

  async execute(command: UpdateBranchCommand): Promise<BranchView> {
    await this.permissions.requirePermission(command.callerUserId, command.gymId, PERMISSIONS.BRANCHES_MANAGE);

    const branch = await this.branches.findById(command.gymId, command.branchId);
    if (!branch) {
      throw new BranchNotFoundError(command.branchId);
    }

    if (command.name !== undefined) branch.name = command.name;
    if (command.address !== undefined) branch.address = command.address;
    if (command.phone !== undefined) branch.phone = command.phone;
    if (command.openingHours !== undefined) branch.openingHours = command.openingHours;
    if (command.capacity !== undefined) branch.capacity = command.capacity;
    if (command.active !== undefined) branch.active = command.active;

    const saved = await this.branches.save(branch);
    return toBranchView(saved);
  }
}
