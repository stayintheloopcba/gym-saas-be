import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MEMBERSHIP_CONTEXT_PORT } from '../../common/context/membership-context.port';
import { Member } from '../members/domain/member.entity';
import { UsersModule } from '../users/users.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { ChangeMemberRoleUseCase } from './application/change-member-role.use-case';
import { ListGymMembersUseCase } from './application/list-gym-members.use-case';
import { RemoveMemberUseCase } from './application/remove-member.use-case';
import { Membership } from './domain/membership.entity';
import { MEMBERSHIP_REPOSITORY } from './domain/membership.repository';
import { TypeOrmMembershipContextAdapter } from './infrastructure/typeorm-membership-context.adapter';
import { TypeOrmMembershipRepository } from './infrastructure/typeorm-membership.repository';

/**
 * Módulo de memberships (capas DDD: domain / application / infrastructure).
 *
 * Su antiguo `MembersController` (`gyms/:id/members`) se desmontó al agregar
 * el nuevo módulo `members`, que sirve esa misma ruta con el modelo `Member`
 * — ver la nota de la tarea 5 en `4-implementation/gym-saas-be.md`. Las
 * use cases de abajo quedan sin controller hasta que la tarea 8 borre este
 * módulo (portando lo que sobreviva, p. ej. la protección de único owner).
 *
 * Vincula `MEMBERSHIP_REPOSITORY` y el `MEMBERSHIP_CONTEXT_PORT` (que consume el
 * `AuthContextMiddleware` en `common` para validar la org activa). Exporta el
 * repo y el port de contexto para que otros módulos los reutilicen sin depender
 * de TypeORM.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Membership, Member]), UsersModule, PermissionsModule],
  providers: [
    { provide: MEMBERSHIP_REPOSITORY, useClass: TypeOrmMembershipRepository },
    { provide: MEMBERSHIP_CONTEXT_PORT, useClass: TypeOrmMembershipContextAdapter },
    ListGymMembersUseCase,
    RemoveMemberUseCase,
    ChangeMemberRoleUseCase,
  ],
  exports: [MEMBERSHIP_REPOSITORY, MEMBERSHIP_CONTEXT_PORT],
})
export class MembershipsModule {}
