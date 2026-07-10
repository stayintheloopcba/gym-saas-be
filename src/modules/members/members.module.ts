import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from '../permissions/domain/role.entity';
import { PermissionsModule } from '../permissions/permissions.module';
import { CreateMemberUseCase } from './application/create-member.use-case';
import { GetMemberUseCase } from './application/get-member.use-case';
import { ListMembersUseCase } from './application/list-members.use-case';
import { RemoveMemberUseCase } from './application/remove-member.use-case';
import { UpdateMemberUseCase } from './application/update-member.use-case';
import { Member } from './domain/member.entity';
import { MEMBER_REPOSITORY } from './domain/member.repository';
import { TypeOrmMemberRepository } from './infrastructure/typeorm-member.repository';
import { MembersController } from './interfaces/members.controller';

/**
 * Módulo de members (capas DDD: domain / application / infrastructure / interfaces).
 *
 * Exporta `MEMBER_REPOSITORY` para que `gyms` (unit of work del owner) y
 * `permissions` (RBAC repuntado) lo consuman sin depender de TypeORM.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Member, Role]), PermissionsModule],
  controllers: [MembersController],
  providers: [
    { provide: MEMBER_REPOSITORY, useClass: TypeOrmMemberRepository },
    CreateMemberUseCase,
    ListMembersUseCase,
    GetMemberUseCase,
    UpdateMemberUseCase,
    RemoveMemberUseCase,
  ],
  exports: [MEMBER_REPOSITORY],
})
export class MembersModule {}
