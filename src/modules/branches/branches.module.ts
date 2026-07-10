import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsModule } from '../permissions/permissions.module';
import { CreateBranchUseCase } from './application/create-branch.use-case';
import { GetBranchUseCase } from './application/get-branch.use-case';
import { ListBranchesUseCase } from './application/list-branches.use-case';
import { RemoveBranchUseCase } from './application/remove-branch.use-case';
import { UpdateBranchUseCase } from './application/update-branch.use-case';
import { Branch } from './domain/branch.entity';
import { BRANCH_REPOSITORY } from './domain/branch.repository';
import { TypeOrmBranchRepository } from './infrastructure/typeorm-branch.repository';
import { BranchesController } from './interfaces/branches.controller';

/**
 * Módulo de sedes (`Branch`) de un gym. Exporta `BRANCH_REPOSITORY` para que
 * `branch-disciplines`/`plans`/`access-logs` lo consuman.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Branch]), PermissionsModule],
  controllers: [BranchesController],
  providers: [
    { provide: BRANCH_REPOSITORY, useClass: TypeOrmBranchRepository },
    CreateBranchUseCase,
    ListBranchesUseCase,
    GetBranchUseCase,
    UpdateBranchUseCase,
    RemoveBranchUseCase,
  ],
  exports: [BRANCH_REPOSITORY],
})
export class BranchesModule {}
