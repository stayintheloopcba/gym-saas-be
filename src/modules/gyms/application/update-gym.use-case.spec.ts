import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { Gym } from '../domain/gym.entity';
import { GymNotFoundError } from '../domain/gym.errors';
import { GymRepository } from '../domain/gym.repository';
import { UpdateGymUseCase } from './update-gym.use-case';

describe('UpdateGymUseCase', () => {
  let gyms: jest.Mocked<GymRepository>;
  let permissions: jest.Mocked<Pick<GymPermissionService, 'requirePermission'>>;
  let useCase: UpdateGymUseCase;

  const buildGym = (): Gym => Object.assign(new Gym(), { id: 'gym-1', name: 'Acme', slug: 'acme' });

  beforeEach(() => {
    gyms = {
      findById: jest.fn().mockResolvedValue(buildGym()),
      findBySlug: jest.fn(),
      save: jest.fn((gym: Gym) => Promise.resolve(gym)),
      softDelete: jest.fn(),
    };
    permissions = { requirePermission: jest.fn().mockResolvedValue(undefined) };
    useCase = new UpdateGymUseCase(gyms, permissions as unknown as GymPermissionService);
  });

  it('applies the provided name', async () => {
    const updated = await useCase.execute('u1', 'gym-1', { name: 'Acme Corp' });

    expect(updated.name).toBe('Acme Corp');
    expect(gyms.save).toHaveBeenCalled();
  });

  it('leaves the name untouched when not provided', async () => {
    const updated = await useCase.execute('u1', 'gym-1', {});

    expect(updated.name).toBe('Acme');
  });

  it('requires GYM_UPDATE before mutating', async () => {
    permissions.requirePermission.mockRejectedValue(new Error('forbidden'));

    await expect(useCase.execute('u1', 'gym-1', { name: 'New' })).rejects.toThrow('forbidden');
    expect(gyms.save).not.toHaveBeenCalled();
  });

  it('throws when the gym does not exist', async () => {
    gyms.findById.mockResolvedValue(null);

    await expect(useCase.execute('u1', 'missing', { name: 'New' })).rejects.toBeInstanceOf(GymNotFoundError);
  });
});
