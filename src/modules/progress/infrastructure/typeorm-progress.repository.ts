import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProgressEntry } from '../domain/progress-entry.entity';
import { ProgressListFilters, ProgressRepository } from '../domain/progress.repository';

@Injectable()
export class TypeOrmProgressRepository implements ProgressRepository {
  constructor(@InjectRepository(ProgressEntry) private readonly repo: Repository<ProgressEntry>) {}

  list(gymId: string, memberId: string, filters: ProgressListFilters): Promise<ProgressEntry[]> {
    const qb = this.repo
      .createQueryBuilder('entry')
      .where('entry.gym_id = :gymId', { gymId })
      .andWhere('entry.member_id = :memberId', { memberId });

    if (filters.routineItemId) {
      qb.andWhere('entry.routine_item_id = :routineItemId', { routineItemId: filters.routineItemId });
    }
    if (filters.from) {
      qb.andWhere('entry.recorded_at >= :from', { from: filters.from });
    }
    if (filters.to) {
      qb.andWhere('entry.recorded_at <= :to', { to: filters.to });
    }

    return qb.orderBy('entry.recorded_at', 'DESC').getMany();
  }

  save(entry: ProgressEntry): Promise<ProgressEntry> {
    return this.repo.save(entry);
  }
}
