import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembersModule } from '../members/members.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { AssignRoutineUseCase } from './application/assign-routine.use-case';
import { CreateRoutineUseCase } from './application/create-routine.use-case';
import { GetRoutineUseCase } from './application/get-routine.use-case';
import { ListMemberRoutinesUseCase } from './application/list-member-routines.use-case';
import { ListRoutinesUseCase } from './application/list-routines.use-case';
import { RemoveRoutineUseCase } from './application/remove-routine.use-case';
import { UnassignRoutineUseCase } from './application/unassign-routine.use-case';
import { UpdateRoutineUseCase } from './application/update-routine.use-case';
import { RoutineAssignment } from './domain/routine-assignment.entity';
import { ROUTINE_ASSIGNMENT_REPOSITORY } from './domain/routine-assignment.repository';
import { RoutineItem } from './domain/routine-item.entity';
import { ROUTINE_ITEM_REPOSITORY } from './domain/routine-item.repository';
import { Routine } from './domain/routine.entity';
import { ROUTINE_REPOSITORY } from './domain/routine.repository';
import { TypeOrmRoutineAssignmentRepository } from './infrastructure/typeorm-routine-assignment.repository';
import { TypeOrmRoutineItemRepository } from './infrastructure/typeorm-routine-item.repository';
import { TypeOrmRoutineRepository } from './infrastructure/typeorm-routine.repository';
import { MemberRoutinesController } from './interfaces/member-routines.controller';
import { RoutinesController } from './interfaces/routines.controller';

/** Módulo de rutinas (`Routine` + `RoutineItem`) y sus asignaciones a members. */
@Module({
  imports: [TypeOrmModule.forFeature([Routine, RoutineItem, RoutineAssignment]), PermissionsModule, MembersModule],
  controllers: [RoutinesController, MemberRoutinesController],
  providers: [
    { provide: ROUTINE_REPOSITORY, useClass: TypeOrmRoutineRepository },
    { provide: ROUTINE_ITEM_REPOSITORY, useClass: TypeOrmRoutineItemRepository },
    { provide: ROUTINE_ASSIGNMENT_REPOSITORY, useClass: TypeOrmRoutineAssignmentRepository },
    CreateRoutineUseCase,
    ListRoutinesUseCase,
    GetRoutineUseCase,
    UpdateRoutineUseCase,
    RemoveRoutineUseCase,
    AssignRoutineUseCase,
    UnassignRoutineUseCase,
    ListMemberRoutinesUseCase,
  ],
  exports: [ROUTINE_REPOSITORY, ROUTINE_ASSIGNMENT_REPOSITORY],
})
export class RoutinesModule {}
