import { DomainError } from '../../../common/errors/domain-error';

export class SubscriptionNotFoundError extends DomainError {
  readonly status = 404;

  constructor(identifier: string) {
    super(`Subscription not found: ${identifier}`);
  }
}

export class PlanNotActiveError extends DomainError {
  readonly status = 409;

  constructor() {
    super('The plan is not active');
  }
}

/** El member tiene una sede base y el plan no está habilitado ahí. */
export class MemberNotAllowedForPlanError extends DomainError {
  readonly status = 409;

  constructor() {
    super("The plan is not available at the member's home branch");
  }
}
