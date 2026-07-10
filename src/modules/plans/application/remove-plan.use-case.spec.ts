import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { Plan } from '../domain/plan.entity';
import { PlanNotFoundError } from '../domain/plan.errors';
import { PlanRepository } from '../domain/plan.repository';
import { RemovePlanUseCase } from './remove-plan.use-case';

describe('RemovePlanUseCase', () => {
  let plans: jest.Mocked<Pick<PlanRepository, 'findById' | 'softDelete'>>;
  let permissions: jest.Mocked<Pick<GymPermissionService, 'requirePermission'>>;
  let useCase: RemovePlanUseCase;

  beforeEach(() => {
    plans = { findById: jest.fn(), softDelete: jest.fn() };
    permissions = { requirePermission: jest.fn().mockResolvedValue(undefined) };
    useCase = new RemovePlanUseCase(plans as unknown as PlanRepository, permissions as unknown as GymPermissionService);
  });

  it('soft-deletes an existing plan', async () => {
    plans.findById.mockResolvedValue(Object.assign(new Plan(), { id: 'plan-1' }));

    await useCase.execute('admin', 'gym-1', 'plan-1');

    expect(plans.softDelete).toHaveBeenCalledWith('plan-1');
  });

  it('throws PlanNotFoundError when missing', async () => {
    plans.findById.mockResolvedValue(null);

    await expect(useCase.execute('admin', 'gym-1', 'missing')).rejects.toBeInstanceOf(PlanNotFoundError);
  });
});
