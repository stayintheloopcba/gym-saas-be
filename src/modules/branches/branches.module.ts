import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DisciplinesModule } from '../disciplines/disciplines.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { CreateBranchUseCase } from './application/create-branch.use-case';
import { GetBranchDisciplinesUseCase } from './application/get-branch-disciplines.use-case';
import { GetBranchUseCase } from './application/get-branch.use-case';
import { ListBranchesUseCase } from './application/list-branches.use-case';
import { RemoveBranchUseCase } from './application/remove-branch.use-case';
import { ReplaceBranchDisciplinesUseCase } from './application/replace-branch-disciplines.use-case';
import { UpdateBranchUseCase } from './application/update-branch.use-case';
import { BranchDiscipline } from './domain/branch-discipline.entity';
import { BRANCH_DISCIPLINE_REPOSITORY } from './domain/branch-discipline.repository';
import { Branch } from './domain/branch.entity';
import { BRANCH_REPOSITORY } from './domain/branch.repository';
import { TypeOrmBranchDisciplineRepository } from './infrastructure/typeorm-branch-discipline.repository';
import { TypeOrmBranchRepository } from './infrastructure/typeorm-branch.repository';
import { BranchesController } from './interfaces/branches.controller';

/**
 * Módulo de sedes (`Branch`) de un gym, incluida la oferta de disciplinas
 * por sede (`BranchDiscipline`). Exporta `BRANCH_REPOSITORY` y
 * `BRANCH_DISCIPLINE_REPOSITORY` para que `plans`/`access-logs` los consuman.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Branch, BranchDiscipline]), PermissionsModule, DisciplinesModule],
  controllers: [BranchesController],
  providers: [
    { provide: BRANCH_REPOSITORY, useClass: TypeOrmBranchRepository },
    { provide: BRANCH_DISCIPLINE_REPOSITORY, useClass: TypeOrmBranchDisciplineRepository },
    CreateBranchUseCase,
    ListBranchesUseCase,
    GetBranchUseCase,
    UpdateBranchUseCase,
    RemoveBranchUseCase,
    GetBranchDisciplinesUseCase,
    ReplaceBranchDisciplinesUseCase,
  ],
  exports: [BRANCH_REPOSITORY, BRANCH_DISCIPLINE_REPOSITORY],
})
export class BranchesModule {}
