import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Discipline } from '../domain/discipline.entity';
import { DisciplineRepository } from '../domain/discipline.repository';

@Injectable()
export class TypeOrmDisciplineRepository implements DisciplineRepository {
  constructor(@InjectRepository(Discipline) private readonly repo: Repository<Discipline>) {}

  findById(id: string): Promise<Discipline | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByCode(code: string): Promise<Discipline | null> {
    return this.repo.findOne({ where: { code } });
  }

  listActive(): Promise<Discipline[]> {
    return this.repo.find({ where: { active: true }, order: { name: 'ASC' } });
  }

  save(discipline: Discipline): Promise<Discipline> {
    return this.repo.save(discipline);
  }
}
