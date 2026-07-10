import { Inject, Injectable } from '@nestjs/common';
import { DEFAULT_MORA_GRACE_DAYS } from '../../gym-settings/domain/gym-settings.entity';
import { GYM_SETTINGS_REPOSITORY } from '../../gym-settings/domain/gym-settings.repository';
import type { GymSettingsRepository } from '../../gym-settings/domain/gym-settings.repository';
import { SubscriptionStatus } from '../../../common/enums/subscription-status.enum';
import { SUBSCRIPTION_REPOSITORY } from '../../subscriptions/domain/subscription.repository';
import type { SubscriptionRepository } from '../../subscriptions/domain/subscription.repository';
import { MemberStatus } from '../domain/member-status.enum';
import { Member } from '../domain/member.entity';

/**
 * Deriva `MemberStatus.OVERDUE` en lectura (Technical Decision #6): nunca se
 * persiste. Solo puede sobreescribir un status `ACTIVE` almacenado — `
 * SUSPENDED`/`INACTIVE` son estados administrativos explícitos que la mora no
 * pisa. Un member queda `OVERDUE` si alguna de sus suscripciones `ACTIVE`
 * tiene `paidUntil` seteado y `paidUntil + moraGraceDays < hoy`. Una
 * suscripción sin pagos todavía (`paidUntil` `null`) no se considera vencida.
 */
@Injectable()
export class ResolveMemberStatus {
  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY) private readonly subscriptions: SubscriptionRepository,
    @Inject(GYM_SETTINGS_REPOSITORY) private readonly gymSettings: GymSettingsRepository,
  ) {}

  async execute(gymId: string, member: Member): Promise<MemberStatus> {
    if (member.status !== MemberStatus.ACTIVE) {
      return member.status;
    }

    const activeSubscriptions = await this.subscriptions.list(gymId, {
      memberId: member.id,
      status: SubscriptionStatus.ACTIVE,
    });
    if (activeSubscriptions.length === 0) {
      return MemberStatus.ACTIVE;
    }

    const settings = await this.gymSettings.findByGymId(gymId);
    const graceDays = settings?.moraGraceDays ?? DEFAULT_MORA_GRACE_DAYS;
    const today = new Date();

    const isOverdue = activeSubscriptions.some((subscription) => {
      if (!subscription.paidUntil) {
        return false;
      }
      const cutoff = new Date(subscription.paidUntil);
      cutoff.setDate(cutoff.getDate() + graceDays);
      return cutoff < today;
    });

    return isOverdue ? MemberStatus.OVERDUE : MemberStatus.ACTIVE;
  }
}
