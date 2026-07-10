import { DomainError } from '../../../common/errors/domain-error';

export class PlanNotFoundError extends DomainError {
  readonly status = 404;

  constructor(identifier: string) {
    super(`Plan not found: ${identifier}`);
  }
}

/** Un plan requiere al menos una sede habilitada. */
export class PlanWithoutBranchesError extends DomainError {
  readonly status = 409;

  constructor() {
    super('A plan must have at least one branch');
  }
}

/** Una disciplina incluida en el plan no está ofrecida en alguna de sus sedes. */
export class DisciplineNotOfferedError extends DomainError {
  readonly status = 409;

  constructor(disciplineId: string, branchId: string) {
    super(`Discipline ${disciplineId} is not offered at branch ${branchId}`);
  }
}
