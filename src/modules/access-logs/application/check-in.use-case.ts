import { Inject, Injectable } from '@nestjs/common';
import { AccessResult } from '../../../common/enums/access-result.enum';
import { SubscriptionStatus } from '../../../common/enums/subscription-status.enum';
import { ResolveMemberStatus } from '../../members/application/resolve-member-status';
import { MemberStatus } from '../../members/domain/member-status.enum';
import { Member } from '../../members/domain/member.entity';
import { MemberNotFoundError } from '../../members/domain/member.errors';
import { MEMBER_REPOSITORY } from '../../members/domain/member.repository';
import type { MemberRepository } from '../../members/domain/member.repository';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { SUBSCRIPTION_REPOSITORY } from '../../subscriptions/domain/subscription.repository';
import type { SubscriptionRepository } from '../../subscriptions/domain/subscription.repository';
import { AccessLog } from '../domain/access-log.entity';
import { ACCESS_LOG_REPOSITORY } from '../domain/access-log.repository';
import type { AccessLogRepository } from '../domain/access-log.repository';
import { AccessLogView, toAccessLogView } from '../interfaces/access-log.view';

export interface CheckInCommand {
  callerUserId: string;
  gymId: string;
  memberId: string;
  branchId?: string;
}

const EXPIRED_REASON = 'expired';
const OVERDUE_REASON = 'overdue';

/**
 * Registra un check-in manual. Siempre crea el registro (`DENIED` es un
 * resultado de negocio, nunca un error — UC-5 / Technical Decision #8):
 * `expired` si no hay una suscripción `ACTIVE` vigente (sin `endDate` o con
 * `endDate` futura), `overdue` si el member está en mora.
 */
@Injectable()
export class CheckInUseCase {
  constructor(
    @Inject(ACCESS_LOG_REPOSITORY) private readonly accessLogs: AccessLogRepository,
    @Inject(MEMBER_REPOSITORY) private readonly members: MemberRepository,
    @Inject(SUBSCRIPTION_REPOSITORY) private readonly subscriptions: SubscriptionRepository,
    private readonly resolveMemberStatus: ResolveMemberStatus,
    private readonly permissions: GymPermissionService,
  ) {}

  async execute(command: CheckInCommand): Promise<AccessLogView> {
    await this.permissions.requirePermission(command.callerUserId, command.gymId, PERMISSIONS.ACCESS_CHECKIN);

    const member = await this.members.findById(command.gymId, command.memberId);
    if (!member) {
      throw new MemberNotFoundError(command.memberId);
    }

    const { result, reason } = await this.evaluate(command.gymId, member.id, member);

    const accessLog = new AccessLog();
    accessLog.gymId = command.gymId;
    accessLog.memberId = command.memberId;
    accessLog.branchId = command.branchId ?? null;
    accessLog.timestamp = new Date();
    accessLog.result = result;
    accessLog.reason = reason;

    const saved = await this.accessLogs.save(accessLog);
    return toAccessLogView(saved);
  }

  private async evaluate(
    gymId: string,
    memberId: string,
    member: Member,
  ): Promise<{ result: AccessResult; reason: string | null }> {
    const activeSubscriptions = await this.subscriptions.list(gymId, {
      memberId,
      status: SubscriptionStatus.ACTIVE,
    });
    const today = new Date().toISOString().slice(0, 10);
    const hasValidSubscription = activeSubscriptions.some((s) => !s.endDate || s.endDate >= today);

    if (!hasValidSubscription) {
      return { result: AccessResult.DENIED, reason: EXPIRED_REASON };
    }

    const status = await this.resolveMemberStatus.execute(gymId, member);
    if (status === MemberStatus.OVERDUE) {
      return { result: AccessResult.DENIED, reason: OVERDUE_REASON };
    }

    return { result: AccessResult.GRANTED, reason: null };
  }
}
