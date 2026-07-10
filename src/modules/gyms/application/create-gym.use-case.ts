import { Inject, Injectable } from '@nestjs/common';
import { slugify } from '../../../common/lib/slugify';
import { Gym } from '../domain/gym.entity';
import { GYM_REPOSITORY } from '../domain/gym.repository';
import type { GymRepository } from '../domain/gym.repository';
import { GYM_UNIT_OF_WORK } from './gym-unit-of-work.port';
import type { GymUnitOfWork } from './gym-unit-of-work.port';

export interface CreateGymCommand {
  ownerUserId: string;
  name: string;
}

/** Slug de respaldo cuando el `name` no produce ningún carácter URL-safe. */
const FALLBACK_SLUG = 'gym';

/** Duración del trial cosmético al crear una organización. */
const TRIAL_DAYS = 7;
const TRIAL_MS = TRIAL_DAYS * 24 * 60 * 60 * 1000;

/**
 * Crea una organización y, atómicamente, la membresía `OWNER` del creador.
 *
 * Deriva un slug único a partir del nombre: si el slug base ya pertenece a una
 * organización activa, agrega un sufijo numérico incremental hasta encontrar uno
 * libre. La persistencia atómica se delega al `GymUnitOfWork`.
 */
@Injectable()
export class CreateGymUseCase {
  constructor(
    @Inject(GYM_REPOSITORY) private readonly gyms: GymRepository,
    @Inject(GYM_UNIT_OF_WORK) private readonly unitOfWork: GymUnitOfWork,
  ) {}

  async execute(command: CreateGymCommand): Promise<Gym> {
    const name = command.name.trim();
    const slug = await this.deriveUniqueSlug(name);

    const gym = new Gym();
    gym.name = name;
    gym.slug = slug;
    gym.trialEndsAt = new Date(Date.now() + TRIAL_MS);

    return this.unitOfWork.createGymWithOwner(gym, command.ownerUserId);
  }

  /** `base`, `base-2`, `base-3`, … hasta encontrar un slug no usado por una org activa. */
  private async deriveUniqueSlug(name: string): Promise<string> {
    const base = slugify(name) || FALLBACK_SLUG;

    let candidate = base;
    let suffix = 2;
    while (await this.gyms.findBySlug(candidate)) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }
}
