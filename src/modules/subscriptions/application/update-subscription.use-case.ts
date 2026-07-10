import { Inject, Injectable } from '@nestjs/common';
import { RenewalMode } from '../../../common/enums/renewal-mode.enum';
import { SubscriptionStatus } from '../../../common/enums/subscription-status.enum';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { SubscriptionNotFoundError } from '../domain/subscription.errors';
import { SUBSCRIPTION_REPOSITORY } from '../domain/subscription.repository';
import type { SubscriptionRepository } from '../domain/subscription.repository';
import { SubscriptionView, toSubscriptionView } from '../interfaces/subscription.view';

export interface UpdateSubscriptionCommand {
  callerUserId: string;
  gymId: string;
  subscriptionId: string;
  status?: SubscriptionStatus.CANCELLED;
  renewalMode?: RenewalMode;
  endDate?: string;
}

/** Cancela y/o cambia `renewalMode`/`endDate`. `paidUntil` nunca se toca acá. */
@Injectable()
export class UpdateSubscriptionUseCase {
  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY) private readonly subscriptions: SubscriptionRepository,
    private readonly permissions: GymPermissionService,
  ) {}

  async execute(command: UpdateSubscriptionCommand): Promise<SubscriptionView> {
    await this.permissions.requirePermission(command.callerUserId, command.gymId, PERMISSIONS.SUBSCRIPTIONS_MANAGE);

    const subscription = await this.subscriptions.findById(command.gymId, command.subscriptionId);
    if (!subscription) {
      throw new SubscriptionNotFoundError(command.subscriptionId);
    }

    if (command.status !== undefined) subscription.status = command.status;
    if (command.renewalMode !== undefined) subscription.renewalMode = command.renewalMode;
    if (command.endDate !== undefined) subscription.endDate = command.endDate;

    const saved = await this.subscriptions.save(subscription);
    return toSubscriptionView(saved);
  }
}
