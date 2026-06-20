import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembershipsModule } from '../memberships/memberships.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { Role } from '../permissions/domain/role.entity';
import { UsersModule } from '../users/users.module';
import { CreateRoleUseCase } from './application/create-role.use-case';
import { AssignMemberCustomRoleUseCase } from './application/assign-member-custom-role.use-case';
import { DeleteRoleUseCase } from './application/delete-role.use-case';
import { ListRolesUseCase } from './application/list-roles.use-case';
import { UpdateRoleUseCase } from './application/update-role.use-case';
import { ROLE_REPOSITORY } from './domain/role.repository';
import { TypeOrmRoleRepository } from './infrastructure/typeorm-role.repository';
import { MyPermissionsController } from './interfaces/my-permissions.controller';
import { PermissionAdminController } from './interfaces/permission-admin.controller';
import { RolesController } from './interfaces/roles.controller';

/**
 * Módulo de administración de roles y permisos (Fase 4 — RABAC). Reutiliza la
 * entidad `Role` del módulo de permisos y sus servicios de evaluación/asignación.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Role]), PermissionsModule, MembershipsModule, UsersModule],
  controllers: [RolesController, PermissionAdminController, MyPermissionsController],
  providers: [
    { provide: ROLE_REPOSITORY, useClass: TypeOrmRoleRepository },
    CreateRoleUseCase,
    AssignMemberCustomRoleUseCase,
    ListRolesUseCase,
    UpdateRoleUseCase,
    DeleteRoleUseCase,
  ],
})
export class RolesModule {}
