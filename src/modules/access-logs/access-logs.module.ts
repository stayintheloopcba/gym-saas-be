import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembersModule } from '../members/members.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { CheckInUseCase } from './application/check-in.use-case';
import { ListAccessLogsUseCase } from './application/list-access-logs.use-case';
import { AccessLog } from './domain/access-log.entity';
import { ACCESS_LOG_REPOSITORY } from './domain/access-log.repository';
import { TypeOrmAccessLogRepository } from './infrastructure/typeorm-access-log.repository';
import { AccessLogsController } from './interfaces/access-logs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AccessLog]), PermissionsModule, MembersModule, SubscriptionsModule],
  controllers: [AccessLogsController],
  providers: [
    { provide: ACCESS_LOG_REPOSITORY, useClass: TypeOrmAccessLogRepository },
    CheckInUseCase,
    ListAccessLogsUseCase,
  ],
  exports: [ACCESS_LOG_REPOSITORY],
})
export class AccessLogsModule {}
