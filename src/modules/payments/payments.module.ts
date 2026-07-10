import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GymSettingsModule } from '../gym-settings/gym-settings.module';
import { MembersModule } from '../members/members.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { CreatePaymentUseCase } from './application/create-payment.use-case';
import { ListPaymentsUseCase } from './application/list-payments.use-case';
import { RecomputePaidUntil } from './application/recompute-paid-until';
import { VoidPaymentUseCase } from './application/void-payment.use-case';
import { Payment } from './domain/payment.entity';
import { PAYMENT_REPOSITORY } from './domain/payment.repository';
import { TypeOrmPaymentRepository } from './infrastructure/typeorm-payment.repository';
import { PaymentsController } from './interfaces/payments.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment]),
    PermissionsModule,
    MembersModule,
    SubscriptionsModule,
    GymSettingsModule,
  ],
  controllers: [PaymentsController],
  providers: [
    { provide: PAYMENT_REPOSITORY, useClass: TypeOrmPaymentRepository },
    RecomputePaidUntil,
    CreatePaymentUseCase,
    ListPaymentsUseCase,
    VoidPaymentUseCase,
  ],
  exports: [PAYMENT_REPOSITORY],
})
export class PaymentsModule {}
