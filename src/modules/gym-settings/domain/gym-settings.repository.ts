import { GymSettings } from './gym-settings.entity';

/** Token de inyección para el port `GymSettingsRepository`. */
export const GYM_SETTINGS_REPOSITORY = Symbol('GYM_SETTINGS_REPOSITORY');

/** Port de persistencia de `GymSettings` (1:1 con `Gym`). */
export interface GymSettingsRepository {
  findByGymId(gymId: string): Promise<GymSettings | null>;
  save(settings: GymSettings): Promise<GymSettings>;
}
