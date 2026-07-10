import { Inject, Injectable } from '@nestjs/common';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { SubscriptionListFilters, SUBSCRIPTION_REPOSITORY } from '../domain/subscription.repository';
import type { SubscriptionRepository } from '../domain/subscription.repository';
import { SubscriptionView, toSubscriptionView } from '../interfaces/subscription.view';

@Injectable()
export class ListSubscriptionsUseCase {
  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY) private readonly subscriptions: SubscriptionRepository,
    private readonly permissions: GymPermissionService,
  ) {}

  async execute(callerUserId: string, gymId: string, filters: SubscriptionListFilters): Promise<SubscriptionView[]> {
    await this.permissions.requirePermission(callerUserId, gymId, PERMISSIONS.SUBSCRIPTIONS_READ);

    const subscriptions = await this.subscriptions.list(gymId, filters);
    return subscriptions.map(toSubscriptionView);
  }
}
