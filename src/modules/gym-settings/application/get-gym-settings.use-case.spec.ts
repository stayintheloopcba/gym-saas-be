import { PaymentMethod } from '../../../common/enums/payment-method.enum';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { GymSettings } from '../domain/gym-settings.entity';
import { GymSettingsRepository } from '../domain/gym-settings.repository';
import { GetGymSettingsUseCase } from './get-gym-settings.use-case';

describe('GetGymSettingsUseCase', () => {
  let settingsRepo: jest.Mocked<GymSettingsRepository>;
  let permissions: jest.Mocked<Pick<GymPermissionService, 'requirePermission'>>;
  let useCase: GetGymSettingsUseCase;

  beforeEach(() => {
    settingsRepo = { findByGymId: jest.fn(), save: jest.fn() };
    permissions = { requirePermission: jest.fn().mockResolvedValue(undefined) };
    useCase = new GetGymSettingsUseCase(settingsRepo, permissions as unknown as GymPermissionService);
  });

  it('returns the saved settings when they exist', async () => {
    settingsRepo.findByGymId.mockResolvedValue(
      Object.assign(new GymSettings(), {
        gymId: 'gym-1',
        timezone: 'America/Argentina/Buenos_Aires',
        currency: 'ARS',
        moraGraceDays: 10,
        moraSurchargePct: '2.50',
        enabledPaymentMethods: [PaymentMethod.CASH, PaymentMethod.CARD],
      }),
    );

    const view = await useCase.execute('u1', 'gym-1');

    expect(view.moraGraceDays).toBe(10);
    expect(view.moraSurchargePct).toBe(2.5);
    expect(view.enabledPaymentMethods).toEqual([PaymentMethod.CASH, PaymentMethod.CARD]);
  });

  it('returns factory defaults when the gym never configured settings', async () => {
    settingsRepo.findByGymId.mockResolvedValue(null);

    const view = await useCase.execute('u1', 'gym-1');

    expect(view.gymId).toBe('gym-1');
    expect(view.currency).toBe('ARS');
    expect(view.enabledPaymentMethods).toEqual([PaymentMethod.CASH]);
    expect(view.logoUrl).toBeNull();
  });
});
