import { Inject, Injectable } from '@nestjs/common';
import { DISCIPLINE_REPOSITORY } from '../domain/discipline.repository';
import type { DisciplineRepository } from '../domain/discipline.repository';
import { DisciplineView, toDisciplineView } from '../interfaces/discipline.view';

/** Catálogo global de disciplinas activas. Sin scoping por gym: cualquier usuario autenticado puede leerlo. */
@Injectable()
export class ListDisciplinesUseCase {
  constructor(@Inject(DISCIPLINE_REPOSITORY) private readonly disciplines: DisciplineRepository) {}

  async execute(): Promise<DisciplineView[]> {
    const disciplines = await this.disciplines.listActive();
    return disciplines.map(toDisciplineView);
  }
}
