import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Discipline } from '../domain/discipline.entity';

interface DisciplineSeed {
  code: string;
  name: string;
}

const SEED_DISCIPLINES: readonly DisciplineSeed[] = [
  { code: 'MUSCULACION', name: 'Musculación' },
  { code: 'CROSSFIT', name: 'Crossfit' },
  { code: 'NATACION', name: 'Natación' },
  { code: 'FUNCIONAL', name: 'Funcional' },
  { code: 'YOGA', name: 'Yoga' },
  { code: 'PILATES', name: 'Pilates' },
  { code: 'BOXEO', name: 'Boxeo' },
  { code: 'SPINNING', name: 'Spinning' },
];

/**
 * Siembra el catálogo global fijo de disciplinas al bootstrap. Idempotente
 * por `code`: una disciplina ya sembrada se deja intacta.
 */
@Injectable()
export class DisciplineSeeder implements OnApplicationBootstrap {
  constructor(@InjectRepository(Discipline) private readonly repo: Repository<Discipline>) {}

  async onApplicationBootstrap(): Promise<void> {
    for (const seed of SEED_DISCIPLINES) {
      const existing = await this.repo.findOne({ where: { code: seed.code } });
      if (!existing) {
        await this.repo.save(this.repo.create({ code: seed.code, name: seed.name, active: true }));
      }
    }
  }
}
