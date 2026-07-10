import { Inject, Injectable } from '@nestjs/common';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { Branch } from '../domain/branch.entity';
import { BRANCH_REPOSITORY } from '../domain/branch.repository';
import type { BranchRepository } from '../domain/branch.repository';

export interface CreateBranchCommand {
  callerUserId: string;
  gymId: string;
  name: string;
  address?: string;
  phone?: string;
  openingHours?: Record<string, unknown>;
  capacity?: number;
  active?: boolean;
}

@Injectable()
export class CreateBranchUseCase {
  constructor(
    @Inject(BRANCH_REPOSITORY) private readonly branches: BranchRepository,
    private readonly permissions: GymPermissionService,
  ) {}

  async execute(command: CreateBranchCommand): Promise<Branch> {
    await this.permissions.requirePermission(command.callerUserId, command.gymId, PERMISSIONS.BRANCHES_MANAGE);

    const branch = new Branch();
    branch.gymId = command.gymId;
    branch.name = command.name;
    branch.address = command.address ?? null;
    branch.phone = command.phone ?? null;
    branch.openingHours = command.openingHours ?? null;
    branch.capacity = command.capacity ?? null;
    branch.active = command.active ?? true;

    return this.branches.save(branch);
  }
}
