import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { Subscription } from '../domain/subscription.entity';
import { SubscriptionRepository } from '../domain/subscription.repository';
import { ListSubscriptionsUseCase } from './list-subscriptions.use-case';

describe('ListSubscriptionsUseCase', () => {
  it('forwards filters and maps to views', async () => {
    const subscriptions: jest.Mocked<Pick<SubscriptionRepository, 'list'>> = {
      list: jest.fn().mockResolvedValue([Object.assign(new Subscription(), { id: 's1', memberId: 'member-1' })]),
    };
    const permissions: jest.Mocked<Pick<GymPermissionService, 'requirePermission'>> = {
      requirePermission: jest.fn().mockResolvedValue(undefined),
    };
    const useCase = new ListSubscriptionsUseCase(
      subscriptions as unknown as SubscriptionRepository,
      permissions as unknown as GymPermissionService,
    );

    const views = await useCase.execute('admin', 'gym-1', { memberId: 'member-1' });

    expect(subscriptions.list).toHaveBeenCalledWith('gym-1', { memberId: 'member-1' });
    expect(views).toHaveLength(1);
  });
});
