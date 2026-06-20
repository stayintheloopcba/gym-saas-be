import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from './domain/session.entity';
import { SESSION_REPOSITORY } from './domain/session.repository';
import { TypeOrmSessionRepository } from './infrastructure/typeorm-session.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Session])],
  providers: [{ provide: SESSION_REPOSITORY, useClass: TypeOrmSessionRepository }],
  exports: [SESSION_REPOSITORY],
})
export class SessionsModule {}
