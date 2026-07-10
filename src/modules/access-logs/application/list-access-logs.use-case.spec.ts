import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { AccessLog } from '../domain/access-log.entity';
import { AccessLogRepository } from '../domain/access-log.repository';
import { ListAccessLogsUseCase } from './list-access-logs.use-case';

describe('ListAccessLogsUseCase', () => {
  it('forwards filters and maps to views', async () => {
    const accessLogs: jest.Mocked<Pick<AccessLogRepository, 'list'>> = {
      list: jest.fn().mockResolvedValue([Object.assign(new AccessLog(), { id: 'log-1', memberId: 'member-1' })]),
    };
    const permissions: jest.Mocked<Pick<GymPermissionService, 'requirePermission'>> = {
      requirePermission: jest.fn().mockResolvedValue(undefined),
    };
    const useCase = new ListAccessLogsUseCase(
      accessLogs as unknown as AccessLogRepository,
      permissions as unknown as GymPermissionService,
    );

    const views = await useCase.execute('admin', 'gym-1', { memberId: 'member-1' });

    expect(accessLogs.list).toHaveBeenCalledWith('gym-1', { memberId: 'member-1' });
    expect(views).toHaveLength(1);
  });
});
