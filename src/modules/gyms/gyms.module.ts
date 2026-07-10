import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembersModule } from '../members/members.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { StorageModule } from '../storage/storage.module';
import { CreateGymUseCase } from './application/create-gym.use-case';
import { DeleteGymUseCase } from './application/delete-gym.use-case';
import { GetOnboardingStatusUseCase } from './application/get-onboarding-status.use-case';
import { GetGymUseCase } from './application/get-gym.use-case';
import { ListMyGymsUseCase } from './application/list-my-gyms.use-case';
import { GYM_UNIT_OF_WORK } from './application/gym-unit-of-work.port';
import { SetGymImageUseCase } from './application/set-gym-image.use-case';
import { UpdateGymUseCase } from './application/update-gym.use-case';
import { Gym } from './domain/gym.entity';
import { GYM_REPOSITORY } from './domain/gym.repository';
import { TypeOrmGymUnitOfWork } from './infrastructure/typeorm-gym-unit-of-work';
import { TypeOrmGymRepository } from './infrastructure/typeorm-gym.repository';
import { ActiveGymCookie } from './interfaces/active-gym-cookie';
import { OnboardingController } from './interfaces/onboarding.controller';
import { GymsController } from './interfaces/gyms.controller';

/**
 * Módulo de gyms (capas DDD). Importa members y permisos. Aloja también el
 * `OnboardingController`, parte de la capacidad `gym-context`.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Gym]), MembersModule, PermissionsModule, StorageModule],
  controllers: [GymsController, OnboardingController],
  providers: [
    { provide: GYM_REPOSITORY, useClass: TypeOrmGymRepository },
    { provide: GYM_UNIT_OF_WORK, useClass: TypeOrmGymUnitOfWork },
    CreateGymUseCase,
    GetGymUseCase,
    UpdateGymUseCase,
    SetGymImageUseCase,
    DeleteGymUseCase,
    ListMyGymsUseCase,
    GetOnboardingStatusUseCase,
    ActiveGymCookie,
  ],
  // Exportados para que `AuthModule` provisione la organización en el registro
  // self-serve (crear org + setear la cookie de org activa).
  exports: [CreateGymUseCase, ActiveGymCookie],
})
export class GymsModule {}
