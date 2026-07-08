import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvitationsModule } from '../invitations/invitations.module';
import { MembershipsModule } from '../memberships/memberships.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { Role } from '../permissions/domain/role.entity';
import { PlatformAdminModule } from '../platform-admin/platform-admin.module';
import { UsersModule } from '../users/users.module';
import { CreateRoleUseCase } from './application/create-role.use-case';
import { DeleteRoleUseCase } from './application/delete-role.use-case';
import { ListRolesUseCase } from './application/list-roles.use-case';
import { ReplaceRolePermissionsUseCase } from './application/replace-role-permissions.use-case';
import { UpdateRoleUseCase } from './application/update-role.use-case';
import { ROLE_REPOSITORY } from './domain/role.repository';
import { TypeOrmRoleRepository } from './infrastructure/typeorm-role.repository';
import { AdminPermissionsController } from './interfaces/admin-permissions.controller';
import { AdminRolesController } from './interfaces/admin-roles.controller';
import { MyPermissionsController } from './interfaces/my-permissions.controller';
import { RolesController } from './interfaces/roles.controller';

/**
 * Módulo del catálogo global de roles: administración platform-admin
 * (`/admin/roles`, `/admin/permissions`) + listado org-scoped de solo lectura.
 * Reutiliza la entidad `Role` del módulo de permisos.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Role]),
    PermissionsModule,
    MembershipsModule,
    InvitationsModule,
    PlatformAdminModule,
    UsersModule,
  ],
  controllers: [RolesController, AdminRolesController, AdminPermissionsController, MyPermissionsController],
  providers: [
    { provide: ROLE_REPOSITORY, useClass: TypeOrmRoleRepository },
    CreateRoleUseCase,
    UpdateRoleUseCase,
    DeleteRoleUseCase,
    ListRolesUseCase,
    ReplaceRolePermissionsUseCase,
  ],
})
export class RolesModule {}
