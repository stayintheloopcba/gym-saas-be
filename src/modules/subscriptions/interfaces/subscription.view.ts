import { RenewalMode } from '../../../common/enums/renewal-mode.enum';
import { SubscriptionStatus } from '../../../common/enums/subscription-status.enum';
import { Subscription } from '../domain/subscription.entity';

export interface SubscriptionView {
  id: string;
  gymId: string;
  memberId: string;
  planId: string;
  startDate: string;
  endDate: string | null;
  paidUntil: string | null;
  status: SubscriptionStatus;
  renewalMode: RenewalMode;
  createdAt: Date;
}

export function toSubscriptionView(subscription: Subscription): SubscriptionView {
  return {
    id: subscription.id,
    gymId: subscription.gymId,
    memberId: subscription.memberId,
    planId: subscription.planId,
    startDate: subscription.startDate,
    endDate: subscription.endDate,
    paidUntil: subscription.paidUntil,
    status: subscription.status,
    renewalMode: subscription.renewalMode,
    createdAt: subscription.createdAt,
  };
}
