import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { Gym } from '../domain/gym.entity';
import { GymNotFoundError } from '../domain/gym.errors';
import { GymRepository } from '../domain/gym.repository';
import { UpdateGymUseCase } from './update-gym.use-case';

describe('UpdateGymUseCase', () => {
  let gyms: jest.Mocked<GymRepository>;
  let permissions: jest.Mocked<Pick<GymPermissionService, 'requirePermission'>>;
  let useCase: UpdateGymUseCase;

  const buildOrg = (): Gym =>
    Object.assign(new Gym(), {
      id: 'gym-1',
      name: 'Acme',
      slug: 'acme',
      primaryColor: null,
      secondaryColor: null,
      fontFamily: null,
    });

  beforeEach(() => {
    gyms = {
      findById: jest.fn().mockResolvedValue(buildOrg()),
      findBySlug: jest.fn(),
      save: jest.fn((org: Gym) => Promise.resolve(org)),
      softDelete: jest.fn(),
    };
    permissions = { requirePermission: jest.fn().mockResolvedValue(undefined) };
    useCase = new UpdateGymUseCase(gyms, permissions as unknown as GymPermissionService);
  });

  it('applies only the provided fields', async () => {
    const updated = await useCase.execute('u1', 'gym-1', { primaryColor: '#0F62FE', fontFamily: 'Inter' });

    expect(updated.primaryColor).toBe('#0F62FE');
    expect(updated.fontFamily).toBe('Inter');
    // name no provisto → se conserva
    expect(updated.name).toBe('Acme');
    expect(gyms.save).toHaveBeenCalled();
  });

  it('requires ORGANIZATION_UPDATE before mutating', async () => {
    permissions.requirePermission.mockRejectedValue(new Error('forbidden'));

    await expect(useCase.execute('u1', 'gym-1', { name: 'New' })).rejects.toThrow('forbidden');
    expect(gyms.save).not.toHaveBeenCalled();
  });

  it('throws when the gym does not exist', async () => {
    gyms.findById.mockResolvedValue(null);

    await expect(useCase.execute('u1', 'missing', { name: 'New' })).rejects.toBeInstanceOf(GymNotFoundError);
  });
});
