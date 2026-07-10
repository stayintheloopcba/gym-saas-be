import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoutineItem } from '../domain/routine-item.entity';
import { RoutineItemInput, RoutineItemRepository } from '../domain/routine-item.repository';

@Injectable()
export class TypeOrmRoutineItemRepository implements RoutineItemRepository {
  constructor(@InjectRepository(RoutineItem) private readonly repo: Repository<RoutineItem>) {}

  findById(gymId: string, id: string): Promise<RoutineItem | null> {
    return this.repo.findOne({ where: { id, gymId } });
  }

  listByRoutine(routineId: string): Promise<RoutineItem[]> {
    return this.repo.find({ where: { routineId }, order: { order: 'ASC' } });
  }

  async replaceSet(gymId: string, routineId: string, items: RoutineItemInput[]): Promise<RoutineItem[]> {
    await this.repo.softDelete({ routineId });

    const rows = items.map((item) =>
      this.repo.create({
        gymId,
        routineId,
        exerciseName: item.exerciseName,
        sets: item.sets,
        reps: item.reps,
        notes: item.notes ?? null,
        order: item.order,
      }),
    );
    if (rows.length === 0) {
      return [];
    }
    return this.repo.save(rows);
  }
}
