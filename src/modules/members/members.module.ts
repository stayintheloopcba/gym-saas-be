import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MEMBERSHIP_CONTEXT_PORT } from '../../common/context/membership-context.port';
import { Role } from '../permissions/domain/role.entity';
import { PermissionsModule } from '../permissions/permissions.module';
import { UsersModule } from '../users/users.module';
import { ChangeMemberRoleUseCase } from './application/change-member-role.use-case';
import { CreateMemberUseCase } from './application/create-member.use-case';
import { GetMemberUseCase } from './application/get-member.use-case';
import { GrantPortalAccessUseCase } from './application/grant-portal-access.use-case';
import { ListMembersUseCase } from './application/list-members.use-case';
import { RemoveMemberUseCase } from './application/remove-member.use-case';
import { UpdateMemberUseCase } from './application/update-member.use-case';
import { Member } from './domain/member.entity';
import { MEMBER_REPOSITORY } from './domain/member.repository';
import { TypeOrmMemberContextAdapter } from './infrastructure/typeorm-member-context.adapter';
import { TypeOrmMemberRepository } from './infrastructure/typeorm-member.repository';
import { MembersController } from './interfaces/members.controller';

/**
 * Módulo de members (capas DDD: domain / application / infrastructure / interfaces).
 *
 * Exporta `MEMBER_REPOSITORY` para que `gyms` (unit of work del owner) y
 * `permissions`/`roles` (RBAC repuntado, borrado de roles en uso) lo consuman
 * sin depender de TypeORM, y `MEMBERSHIP_CONTEXT_PORT` (implementado por
 * `TypeOrmMemberContextAdapter`, portado de `memberships` en la tarea 8) para
 * que `CommonModule` se lo inyecte al `AuthContextMiddleware`.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Member, Role]), PermissionsModule, UsersModule],
  controllers: [MembersController],
  providers: [
    { provide: MEMBER_REPOSITORY, useClass: TypeOrmMemberRepository },
    { provide: MEMBERSHIP_CONTEXT_PORT, useClass: TypeOrmMemberContextAdapter },
    CreateMemberUseCase,
    ListMembersUseCase,
    GetMemberUseCase,
    UpdateMemberUseCase,
    RemoveMemberUseCase,
    ChangeMemberRoleUseCase,
    GrantPortalAccessUseCase,
  ],
  exports: [MEMBER_REPOSITORY, MEMBERSHIP_CONTEXT_PORT],
})
export class MembersModule {}
