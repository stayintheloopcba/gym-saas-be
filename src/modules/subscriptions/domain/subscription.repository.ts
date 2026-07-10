import { SubscriptionStatus } from '../../../common/enums/subscription-status.enum';
import { Subscription } from './subscription.entity';

export const SUBSCRIPTION_REPOSITORY = Symbol('SUBSCRIPTION_REPOSITORY');

export interface SubscriptionListFilters {
  memberId?: string;
  status?: SubscriptionStatus;
}

export interface SubscriptionRepository {
  findById(gymId: string, id: string): Promise<Subscription | null>;
  list(gymId: string, filters: SubscriptionListFilters): Promise<Subscription[]>;
  save(subscription: Subscription): Promise<Subscription>;
}
