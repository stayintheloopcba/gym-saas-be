import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { Member } from '../members/domain/member.entity';
import { GymPermissionService } from './application/gym-permission.service';
import { OwnershipContextService } from './application/ownership-context.service';
import { Permission } from './domain/permission.entity';
import { PERMISSION_CATALOG_REPOSITORY } from './domain/permission-catalog.repository';
import { PERMISSION_REPOSITORY } from './domain/permission.repository';
import { RolePermission } from './domain/role-permission.entity';
import { ROLE_PERMISSION_REPOSITORY } from './domain/role-permission.repository';
import { Role } from './domain/role.entity';
import { CatalogSeeder } from './infrastructure/catalog.seeder';
import { TypeOrmPermissionCatalogRepository } from './infrastructure/typeorm-permission-catalog.repository';
import { TypeOrmPermissionRepository } from './infrastructure/typeorm-permission.repository';
import { TypeOrmRolePermissionRepository } from './infrastructure/typeorm-role-permission.repository';
import { OwnershipValidatorRegistry } from './ownership/ownership-validator-registry';

@Module({
  imports: [TypeOrmModule.forFeature([Member, Role, Permission, RolePermission])],
  providers: [
    { provide: PERMISSION_REPOSITORY, useClass: TypeOrmPermissionRepository },
    { provide: ROLE_PERMISSION_REPOSITORY, useClass: TypeOrmRolePermissionRepository },
    { provide: PERMISSION_CATALOG_REPOSITORY, useClass: TypeOrmPermissionCatalogRepository },
    GymPermissionService,
    OwnershipContextService,
    OwnershipValidatorRegistry,
    CatalogSeeder,
    PermissionGuard,
  ],
  exports: [
    GymPermissionService,
    OwnershipContextService,
    OwnershipValidatorRegistry,
    PermissionGuard,
    PERMISSION_REPOSITORY,
    ROLE_PERMISSION_REPOSITORY,
    PERMISSION_CATALOG_REPOSITORY,
  ],
})
export class PermissionsModule {}
