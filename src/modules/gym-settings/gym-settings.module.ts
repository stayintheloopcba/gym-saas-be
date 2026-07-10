import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsModule } from '../permissions/permissions.module';
import { GetGymSettingsUseCase } from './application/get-gym-settings.use-case';
import { UpdateGymSettingsUseCase } from './application/update-gym-settings.use-case';
import { GymSettings } from './domain/gym-settings.entity';
import { GYM_SETTINGS_REPOSITORY } from './domain/gym-settings.repository';
import { TypeOrmGymSettingsRepository } from './infrastructure/typeorm-gym-settings.repository';
import { GymSettingsController } from './interfaces/gym-settings.controller';

/**
 * Módulo de configuración del gym (1:1 con `Gym`). Exporta
 * `GYM_SETTINGS_REPOSITORY` para que `gyms` (subida de logo/banner) lo
 * consuma sin depender de TypeORM.
 */
@Module({
  imports: [TypeOrmModule.forFeature([GymSettings]), PermissionsModule],
  controllers: [GymSettingsController],
  providers: [
    { provide: GYM_SETTINGS_REPOSITORY, useClass: TypeOrmGymSettingsRepository },
    GetGymSettingsUseCase,
    UpdateGymSettingsUseCase,
  ],
  exports: [GYM_SETTINGS_REPOSITORY],
})
export class GymSettingsModule {}
