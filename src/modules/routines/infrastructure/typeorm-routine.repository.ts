import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Routine } from '../domain/routine.entity';
import { RoutineRepository } from '../domain/routine.repository';

@Injectable()
export class TypeOrmRoutineRepository implements RoutineRepository {
  constructor(@InjectRepository(Routine) private readonly repo: Repository<Routine>) {}

  findById(gymId: string, id: string): Promise<Routine | null> {
    return this.repo.findOne({ where: { id, gymId } });
  }

  listByGym(gymId: string): Promise<Routine[]> {
    return this.repo.find({ where: { gymId }, order: { name: 'ASC' } });
  }

  save(routine: Routine): Promise<Routine> {
    return this.repo.save(routine);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
