import { RenewalMode } from '../../../common/enums/renewal-mode.enum';
import { SubscriptionStatus } from '../../../common/enums/subscription-status.enum';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { Subscription } from '../domain/subscription.entity';
import { SubscriptionNotFoundError } from '../domain/subscription.errors';
import { SubscriptionRepository } from '../domain/subscription.repository';
import { UpdateSubscriptionUseCase } from './update-subscription.use-case';

describe('UpdateSubscriptionUseCase', () => {
  let subscriptions: jest.Mocked<Pick<SubscriptionRepository, 'findById' | 'save'>>;
  let permissions: jest.Mocked<Pick<GymPermissionService, 'requirePermission'>>;
  let useCase: UpdateSubscriptionUseCase;

  beforeEach(() => {
    subscriptions = {
      findById: jest.fn().mockResolvedValue(
        Object.assign(new Subscription(), {
          id: 'sub-1',
          status: SubscriptionStatus.ACTIVE,
          renewalMode: RenewalMode.MANUAL,
        }),
      ),
      save: jest.fn((s: Subscription) => Promise.resolve(s)),
    };
    permissions = { requirePermission: jest.fn().mockResolvedValue(undefined) };
    useCase = new UpdateSubscriptionUseCase(
      subscriptions as unknown as SubscriptionRepository,
      permissions as unknown as GymPermissionService,
    );
  });

  it('cancels a subscription', async () => {
    const view = await useCase.execute({
      callerUserId: 'admin',
      gymId: 'gym-1',
      subscriptionId: 'sub-1',
      status: SubscriptionStatus.CANCELLED,
    });

    expect(view.status).toBe(SubscriptionStatus.CANCELLED);
  });

  it('changes renewalMode and endDate without touching status', async () => {
    const view = await useCase.execute({
      callerUserId: 'admin',
      gymId: 'gym-1',
      subscriptionId: 'sub-1',
      renewalMode: RenewalMode.AUTO,
      endDate: '2027-01-01',
    });

    expect(view.renewalMode).toBe(RenewalMode.AUTO);
    expect(view.endDate).toBe('2027-01-01');
    expect(view.status).toBe(SubscriptionStatus.ACTIVE);
  });

  it('throws SubscriptionNotFoundError when missing', async () => {
    subscriptions.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ callerUserId: 'admin', gymId: 'gym-1', subscriptionId: 'missing' }),
    ).rejects.toBeInstanceOf(SubscriptionNotFoundError);
  });
});
