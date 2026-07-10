import { Gym } from '../domain/gym.entity';
import { GymRepository } from '../domain/gym.repository';
import { CreateGymUseCase } from './create-gym.use-case';
import { GymUnitOfWork } from './gym-unit-of-work.port';

describe('CreateGymUseCase', () => {
  let gyms: jest.Mocked<GymRepository>;
  let unitOfWork: jest.Mocked<GymUnitOfWork>;
  let useCase: CreateGymUseCase;

  beforeEach(() => {
    gyms = {
      findById: jest.fn(),
      findBySlug: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    };
    unitOfWork = {
      createGymWithOwner: jest.fn((org: Gym, _ownerUserId: string) => Promise.resolve(org)),
    };
    useCase = new CreateGymUseCase(gyms, unitOfWork);
  });

  it('derives a unique slug with a numeric suffix on collision', async () => {
    gyms.findBySlug.mockImplementation((slug) => Promise.resolve(slug === 'acme' ? ({ id: 'existing' } as Gym) : null));

    const org = await useCase.execute({ ownerUserId: 'u1', name: 'Acme' });

    expect(org.slug).toBe('acme-2');
  });

  it('creates the org and OWNER membership atomically via the unit of work', async () => {
    gyms.findBySlug.mockResolvedValue(null);

    await useCase.execute({ ownerUserId: 'u1', name: 'Acme' });

    expect(unitOfWork.createGymWithOwner).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Acme', slug: 'acme' }),
      'u1',
    );
  });

  it('falls back to a default slug when the name yields no url-safe characters', async () => {
    gyms.findBySlug.mockResolvedValue(null);

    const org = await useCase.execute({ ownerUserId: 'u1', name: '—' });

    expect(org.slug).toBe('gym');
  });

  it('sets a 7-day cosmetic trial on creation', async () => {
    gyms.findBySlug.mockResolvedValue(null);

    const before = Date.now();
    const org = await useCase.execute({ ownerUserId: 'u1', name: 'Acme' });
    const after = Date.now();

    expect(org.trialEndsAt).toBeInstanceOf(Date);
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    expect(org.trialEndsAt!.getTime()).toBeGreaterThanOrEqual(before + sevenDays);
    expect(org.trialEndsAt!.getTime()).toBeLessThanOrEqual(after + sevenDays);
  });
});
