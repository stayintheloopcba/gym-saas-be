import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MEMBERSHIP_CONTEXT_PORT } from '../../common/context/membership-context.port';
import { UsersModule } from '../users/users.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { ChangeMemberRoleUseCase } from './application/change-member-role.use-case';
import { ListOrganizationMembersUseCase } from './application/list-organization-members.use-case';
import { RemoveMemberUseCase } from './application/remove-member.use-case';
import { Membership } from './domain/membership.entity';
import { MEMBERSHIP_REPOSITORY } from './domain/membership.repository';
import { TypeOrmMembershipContextAdapter } from './infrastructure/typeorm-membership-context.adapter';
import { TypeOrmMembershipRepository } from './infrastructure/typeorm-membership.repository';
import { MembersController } from './interfaces/members.controller';

/**
 * Módulo de memberships (capas DDD: domain / application / infrastructure / interfaces).
 *
 * Vincula `MEMBERSHIP_REPOSITORY` y el `MEMBERSHIP_CONTEXT_PORT` (que consume el
 * `AuthContextMiddleware` en `common` para validar la org activa). Exporta el
 * repo y el port de contexto para que otros módulos los reutilicen sin depender
 * de TypeORM.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Membership]), UsersModule, PermissionsModule],
  controllers: [MembersController],
  providers: [
    { provide: MEMBERSHIP_REPOSITORY, useClass: TypeOrmMembershipRepository },
    { provide: MEMBERSHIP_CONTEXT_PORT, useClass: TypeOrmMembershipContextAdapter },
    ListOrganizationMembersUseCase,
    RemoveMemberUseCase,
    ChangeMemberRoleUseCase,
  ],
  exports: [MEMBERSHIP_REPOSITORY, MEMBERSHIP_CONTEXT_PORT],
})
export class MembershipsModule {}
