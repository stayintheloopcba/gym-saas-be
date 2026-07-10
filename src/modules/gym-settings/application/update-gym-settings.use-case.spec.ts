import { PaymentMethod } from '../../../common/enums/payment-method.enum';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { GymSettings } from '../domain/gym-settings.entity';
import { GymSettingsRepository } from '../domain/gym-settings.repository';
import { UpdateGymSettingsUseCase } from './update-gym-settings.use-case';

describe('UpdateGymSettingsUseCase', () => {
  let settingsRepo: jest.Mocked<GymSettingsRepository>;
  let permissions: jest.Mocked<Pick<GymPermissionService, 'requirePermission'>>;
  let useCase: UpdateGymSettingsUseCase;

  beforeEach(() => {
    settingsRepo = {
      findByGymId: jest.fn().mockResolvedValue(null),
      save: jest.fn((settings: GymSettings) => Promise.resolve(settings)),
    };
    permissions = { requirePermission: jest.fn().mockResolvedValue(undefined) };
    useCase = new UpdateGymSettingsUseCase(settingsRepo, permissions as unknown as GymPermissionService);
  });

  it('creates settings on first replace', async () => {
    const view = await useCase.execute({
      callerUserId: 'admin',
      gymId: 'gym-1',
      timezone: 'America/Argentina/Buenos_Aires',
      currency: 'ARS',
      moraGraceDays: 3,
      moraSurchargePct: 5,
      enabledPaymentMethods: [PaymentMethod.CASH, PaymentMethod.TRANSFER],
    });

    expect(view.gymId).toBe('gym-1');
    expect(view.moraGraceDays).toBe(3);
    expect(view.enabledPaymentMethods).toEqual([PaymentMethod.CASH, PaymentMethod.TRANSFER]);
    expect(settingsRepo.save).toHaveBeenCalled();
  });

  it('never touches logoUrl/bannerUrl (managed by the image-upload endpoints)', async () => {
    settingsRepo.findByGymId.mockResolvedValue(
      Object.assign(new GymSettings(), {
        gymId: 'gym-1',
        logoUrl: 'https://minio/logo.png',
        bannerUrl: 'https://minio/banner.png',
      }),
    );

    const view = await useCase.execute({
      callerUserId: 'admin',
      gymId: 'gym-1',
      timezone: 'UTC',
      currency: 'USD',
      moraGraceDays: 0,
      moraSurchargePct: 0,
      enabledPaymentMethods: [PaymentMethod.CARD],
    });

    expect(view.logoUrl).toBe('https://minio/logo.png');
    expect(view.bannerUrl).toBe('https://minio/banner.png');
  });

  it('replaces the previously stored branding/contact fields wholesale', async () => {
    settingsRepo.findByGymId.mockResolvedValue(
      Object.assign(new GymSettings(), { gymId: 'gym-1', displayName: 'Old name', contactEmail: 'old@example.com' }),
    );

    const view = await useCase.execute({
      callerUserId: 'admin',
      gymId: 'gym-1',
      timezone: 'UTC',
      currency: 'USD',
      moraGraceDays: 0,
      moraSurchargePct: 0,
      enabledPaymentMethods: [PaymentMethod.CARD],
    });

    expect(view.displayName).toBeNull();
    expect(view.contactEmail).toBeNull();
  });
});
