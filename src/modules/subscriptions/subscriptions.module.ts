import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembersModule } from '../members/members.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { PlansModule } from '../plans/plans.module';
import { CreateSubscriptionUseCase } from './application/create-subscription.use-case';
import { ListSubscriptionsUseCase } from './application/list-subscriptions.use-case';
import { UpdateSubscriptionUseCase } from './application/update-subscription.use-case';
import { Subscription } from './domain/subscription.entity';
import { SUBSCRIPTION_REPOSITORY } from './domain/subscription.repository';
import { TypeOrmSubscriptionRepository } from './infrastructure/typeorm-subscription.repository';
import { SubscriptionsController } from './interfaces/subscriptions.controller';

/**
 * Módulo de suscripciones. Exporta `SUBSCRIPTION_REPOSITORY` para que
 * `payments` (task 16) recompute `paidUntil` al crear/anular un pago.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Subscription]), PermissionsModule, MembersModule, PlansModule],
  controllers: [SubscriptionsController],
  providers: [
    { provide: SUBSCRIPTION_REPOSITORY, useClass: TypeOrmSubscriptionRepository },
    CreateSubscriptionUseCase,
    ListSubscriptionsUseCase,
    UpdateSubscriptionUseCase,
  ],
  exports: [SUBSCRIPTION_REPOSITORY],
})
export class SubscriptionsModule {}
