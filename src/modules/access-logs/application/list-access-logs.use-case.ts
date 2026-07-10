import { Inject, Injectable } from '@nestjs/common';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { AccessLogListFilters, ACCESS_LOG_REPOSITORY } from '../domain/access-log.repository';
import type { AccessLogRepository } from '../domain/access-log.repository';
import { AccessLogView, toAccessLogView } from '../interfaces/access-log.view';

@Injectable()
export class ListAccessLogsUseCase {
  constructor(
    @Inject(ACCESS_LOG_REPOSITORY) private readonly accessLogs: AccessLogRepository,
    private readonly permissions: GymPermissionService,
  ) {}

  async execute(callerUserId: string, gymId: string, filters: AccessLogListFilters): Promise<AccessLogView[]> {
    await this.permissions.requirePermission(callerUserId, gymId, PERMISSIONS.ACCESS_READ);

    const accessLogs = await this.accessLogs.list(gymId, filters);
    return accessLogs.map(toAccessLogView);
  }
}
