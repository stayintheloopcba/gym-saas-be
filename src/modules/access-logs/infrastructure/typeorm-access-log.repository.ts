import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccessLog } from '../domain/access-log.entity';
import { AccessLogListFilters, AccessLogRepository } from '../domain/access-log.repository';

@Injectable()
export class TypeOrmAccessLogRepository implements AccessLogRepository {
  constructor(@InjectRepository(AccessLog) private readonly repo: Repository<AccessLog>) {}

  list(gymId: string, filters: AccessLogListFilters): Promise<AccessLog[]> {
    const qb = this.repo.createQueryBuilder('accessLog').where('accessLog.gym_id = :gymId', { gymId });

    if (filters.memberId) {
      qb.andWhere('accessLog.member_id = :memberId', { memberId: filters.memberId });
    }
    if (filters.branchId) {
      qb.andWhere('accessLog.branch_id = :branchId', { branchId: filters.branchId });
    }
    if (filters.from) {
      qb.andWhere('accessLog.timestamp >= :from', { from: filters.from });
    }
    if (filters.to) {
      qb.andWhere('accessLog.timestamp <= :to', { to: filters.to });
    }

    return qb.orderBy('accessLog.timestamp', 'DESC').getMany();
  }

  save(accessLog: AccessLog): Promise<AccessLog> {
    return this.repo.save(accessLog);
  }
}
