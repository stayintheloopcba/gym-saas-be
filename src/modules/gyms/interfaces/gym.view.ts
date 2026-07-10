import { RoleSummary } from '../../permissions/domain/role-summary';
import { Gym } from '../domain/gym.entity';

/** Forma pública de un gym en las respuestas HTTP. Branding vive en `GymSettings`. */
export interface GymView {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  trialEndsAt: Date | null;
}

/** La misma vista anotada con el rol del usuario actual (listado "mis gyms"). */
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
  };
}
