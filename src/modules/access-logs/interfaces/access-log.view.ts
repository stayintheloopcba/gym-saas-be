import { AccessResult } from '../../../common/enums/access-result.enum';
import { AccessLog } from '../domain/access-log.entity';

export interface AccessLogView {
  id: string;
  gymId: string;
  memberId: string;
  branchId: string | null;
  timestamp: Date;
  result: AccessResult;
  reason: string | null;
}

export function toAccessLogView(accessLog: AccessLog): AccessLogView {
  return {
    id: accessLog.id,
    gymId: accessLog.gymId,
    memberId: accessLog.memberId,
    branchId: accessLog.branchId,
    timestamp: accessLog.timestamp,
    result: accessLog.result,
    reason: accessLog.reason,
  };
}
