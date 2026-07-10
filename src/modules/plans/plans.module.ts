import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BranchesModule } from '../branches/branches.module';
import { DisciplinesModule } from '../disciplines/disciplines.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { CreatePlanUseCase } from './application/create-plan.use-case';
import { GetPlanUseCase } from './application/get-plan.use-case';
import { ListPlansUseCase } from './application/list-plans.use-case';
import { RemovePlanUseCase } from './application/remove-plan.use-case';
import { UpdatePlanUseCase } from './application/update-plan.use-case';
import { ValidatePlanScope } from './application/validate-plan-scope';
import { PlanBranch } from './domain/plan-branch.entity';
import { PLAN_BRANCH_REPOSITORY } from './domain/plan-branch.repository';
import { PlanDiscipline } from './domain/plan-discipline.entity';
import { PLAN_DISCIPLINE_REPOSITORY } from './domain/plan-discipline.repository';
import { Plan } from './domain/plan.entity';
import { PLAN_REPOSITORY } from './domain/plan.repository';
import { TypeOrmPlanBranchRepository } from './infrastructure/typeorm-plan-branch.repository';
import { TypeOrmPlanDisciplineRepository } from './infrastructure/typeorm-plan-discipline.repository';
import { TypeOrmPlanRepository } from './infrastructure/typeorm-plan.repository';
import { PlansController } from './interfaces/plans.controller';

/**
 * Módulo de planes: `Plan` + los joins `plan_branches`/`plan_disciplines`
 * (write-through, ver `ValidatePlanScope`). Exporta `PLAN_REPOSITORY` y
 * `PLAN_BRANCH_REPOSITORY` para que `subscriptions` (task 15) los consuma.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Plan, PlanBranch, PlanDiscipline]),
    PermissionsModule,
    BranchesModule,
    DisciplinesModule,
  ],
  controllers: [PlansController],
  providers: [
    { provide: PLAN_REPOSITORY, useClass: TypeOrmPlanRepository },
    { provide: PLAN_BRANCH_REPOSITORY, useClass: TypeOrmPlanBranchRepository },
    { provide: PLAN_DISCIPLINE_REPOSITORY, useClass: TypeOrmPlanDisciplineRepository },
    ValidatePlanScope,
    CreatePlanUseCase,
    ListPlansUseCase,
    GetPlanUseCase,
    UpdatePlanUseCase,
    RemovePlanUseCase,
  ],
  exports: [PLAN_REPOSITORY, PLAN_BRANCH_REPOSITORY],
})
export class PlansModule {}
