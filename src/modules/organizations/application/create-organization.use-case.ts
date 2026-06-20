import { Inject, Injectable } from '@nestjs/common';
import { slugify } from '../../../common/lib/slugify';
import { Organization } from '../domain/organization.entity';
import { ORGANIZATION_REPOSITORY } from '../domain/organization.repository';
import type { OrganizationRepository } from '../domain/organization.repository';
import { ORG_UNIT_OF_WORK } from './org-unit-of-work.port';
import type { OrgUnitOfWork } from './org-unit-of-work.port';

export interface CreateOrganizationCommand {
  ownerUserId: string;
  name: string;
}

/** Slug de respaldo cuando el `name` no produce ningún carácter URL-safe. */
const FALLBACK_SLUG = 'org';

/** Duración del trial cosmético al crear una organización. */
const TRIAL_DAYS = 7;
const TRIAL_MS = TRIAL_DAYS * 24 * 60 * 60 * 1000;

/**
 * Crea una organización y, atómicamente, la membresía `OWNER` del creador.
 *
 * Deriva un slug único a partir del nombre: si el slug base ya pertenece a una
 * organización activa, agrega un sufijo numérico incremental hasta encontrar uno
 * libre. La persistencia atómica se delega al `OrgUnitOfWork`.
 */
@Injectable()
export class CreateOrganizationUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY) private readonly organizations: OrganizationRepository,
    @Inject(ORG_UNIT_OF_WORK) private readonly unitOfWork: OrgUnitOfWork,
  ) {}

  async execute(command: CreateOrganizationCommand): Promise<Organization> {
    const name = command.name.trim();
    const slug = await this.deriveUniqueSlug(name);

    const organization = new Organization();
    organization.name = name;
    organization.slug = slug;
    organization.trialEndsAt = new Date(Date.now() + TRIAL_MS);

    return this.unitOfWork.createOrganizationWithOwner(organization, command.ownerUserId);
  }

  /** `base`, `base-2`, `base-3`, … hasta encontrar un slug no usado por una org activa. */
  private async deriveUniqueSlug(name: string): Promise<string> {
    const base = slugify(name) || FALLBACK_SLUG;

    let candidate = base;
    let suffix = 2;
    while (await this.organizations.findBySlug(candidate)) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }
}
