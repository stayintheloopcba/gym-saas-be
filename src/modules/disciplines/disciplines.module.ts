import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListDisciplinesUseCase } from './application/list-disciplines.use-case';
import { Discipline } from './domain/discipline.entity';
import { DISCIPLINE_REPOSITORY } from './domain/discipline.repository';
import { DisciplineSeeder } from './infrastructure/discipline.seeder';
import { TypeOrmDisciplineRepository } from './infrastructure/typeorm-discipline.repository';
import { DisciplinesController } from './interfaces/disciplines.controller';

/**
 * Módulo del catálogo global de disciplinas (sin `gymId`). Exporta
 * `DISCIPLINE_REPOSITORY` para que `branch-disciplines`/`plans` lo consuman.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Discipline])],
  controllers: [DisciplinesController],
  providers: [
    { provide: DISCIPLINE_REPOSITORY, useClass: TypeOrmDisciplineRepository },
    ListDisciplinesUseCase,
    DisciplineSeeder,
  ],
  exports: [DISCIPLINE_REPOSITORY],
})
export class DisciplinesModule {}
