import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembersModule } from '../members/members.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { CreateRoutineUseCase } from './application/create-routine.use-case';
import { GetRoutineUseCase } from './application/get-routine.use-case';
import { ListRoutinesUseCase } from './application/list-routines.use-case';
import { RemoveRoutineUseCase } from './application/remove-routine.use-case';
import { UpdateRoutineUseCase } from './application/update-routine.use-case';
import { RoutineItem } from './domain/routine-item.entity';
import { ROUTINE_ITEM_REPOSITORY } from './domain/routine-item.repository';
import { Routine } from './domain/routine.entity';
import { ROUTINE_REPOSITORY } from './domain/routine.repository';
import { TypeOrmRoutineItemRepository } from './infrastructure/typeorm-routine-item.repository';
import { TypeOrmRoutineRepository } from './infrastructure/typeorm-routine.repository';
import { RoutinesController } from './interfaces/routines.controller';

/**
 * Módulo de rutinas (`Routine` + `RoutineItem`). Exporta `ROUTINE_REPOSITORY`
 * para que `routine-assignments` (tarea 20) lo consuma.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Routine, RoutineItem]), PermissionsModule, MembersModule],
  controllers: [RoutinesController],
  providers: [
    { provide: ROUTINE_REPOSITORY, useClass: TypeOrmRoutineRepository },
    { provide: ROUTINE_ITEM_REPOSITORY, useClass: TypeOrmRoutineItemRepository },
    CreateRoutineUseCase,
    ListRoutinesUseCase,
    GetRoutineUseCase,
    UpdateRoutineUseCase,
    RemoveRoutineUseCase,
  ],
  exports: [ROUTINE_REPOSITORY],
})
export class RoutinesModule {}
