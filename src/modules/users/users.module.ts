import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '../storage/storage.module';
import { CreateUserUseCase } from './application/create-user.use-case';
import {
  FindUserByEmailUseCase,
  FindUserByGoogleIdUseCase,
  FindUserByIdUseCase,
} from './application/find-user.use-cases';
import { SetUserAvatarUseCase } from './application/set-user-avatar.use-case';
import { UpdateUserProfileUseCase } from './application/update-user-profile.use-case';
import { User } from './domain/user.entity';
import { USER_REPOSITORY } from './domain/user.repository';
import { TypeOrmUserRepository } from './infrastructure/typeorm-user.repository';
import { UsersController } from './interfaces/users.controller';

/**
 * Módulo de usuarios (capa DDD: domain / application / infrastructure).
 *
 * Vincula el port `USER_REPOSITORY` a la implementación TypeORM y exporta los
 * use cases + el port para que `AuthModule` los consuma sin depender de TypeORM.
 */
@Module({
  imports: [TypeOrmModule.forFeature([User]), StorageModule],
  controllers: [UsersController],
  providers: [
    { provide: USER_REPOSITORY, useClass: TypeOrmUserRepository },
    CreateUserUseCase,
    FindUserByIdUseCase,
    FindUserByEmailUseCase,
    FindUserByGoogleIdUseCase,
    UpdateUserProfileUseCase,
    SetUserAvatarUseCase,
  ],
  exports: [USER_REPOSITORY, CreateUserUseCase, FindUserByIdUseCase, FindUserByEmailUseCase, FindUserByGoogleIdUseCase],
})
export class UsersModule {}
