import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembersModule } from '../members/members.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { RoutinesModule } from '../routines/routines.module';
import { ListProgressUseCase } from './application/list-progress.use-case';
import { RecordProgressUseCase } from './application/record-progress.use-case';
import { ProgressEntry } from './domain/progress-entry.entity';
import { PROGRESS_REPOSITORY } from './domain/progress.repository';
import { TypeOrmProgressRepository } from './infrastructure/typeorm-progress.repository';
import { ProgressController } from './interfaces/progress.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProgressEntry]), PermissionsModule, MembersModule, RoutinesModule],
  controllers: [ProgressController],
  providers: [
    { provide: PROGRESS_REPOSITORY, useClass: TypeOrmProgressRepository },
    RecordProgressUseCase,
    ListProgressUseCase,
  ],
  exports: [PROGRESS_REPOSITORY],
})
export class ProgressModule {}
