import { RoleSummary } from '../../permissions/domain/role-summary';
import { Gym } from '../domain/gym.entity';

/** Forma pública de una organización en las respuestas HTTP. */
export interface GymView {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  trialEndsAt: Date | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  fontFamily: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
}

/** La misma vista anotada con el rol del usuario actual (listado "mis orgs"). */
export interface GymWithRoleView extends GymView {
  role: RoleSummary;
}

export function toGymView(gym: Gym): GymView {
  return {
    id: gym.id,
    name: gym.name,
    slug: gym.slug,
    createdAt: gym.createdAt,
    trialEndsAt: gym.trialEndsAt ?? null,
    primaryColor: gym.primaryColor ?? null,
    secondaryColor: gym.secondaryColor ?? null,
    fontFamily: gym.fontFamily ?? null,
    logoUrl: gym.logoUrl ?? null,
    bannerUrl: gym.bannerUrl ?? null,
  };
}
