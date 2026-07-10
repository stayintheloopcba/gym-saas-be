import { AccessLog } from './access-log.entity';

export const ACCESS_LOG_REPOSITORY = Symbol('ACCESS_LOG_REPOSITORY');

export interface AccessLogListFilters {
  memberId?: string;
  branchId?: string;
  from?: string;
  to?: string;
}

export interface AccessLogRepository {
  list(gymId: string, filters: AccessLogListFilters): Promise<AccessLog[]>;
  save(accessLog: AccessLog): Promise<AccessLog>;
}
