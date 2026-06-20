import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { Membership } from '../memberships/domain/membership.entity';
import { OrganizationPermissionService } from './application/organization-permission.service';
import { OwnershipContextService } from './application/ownership-context.service';
import { PermissionAssignmentService } from './application/permission-assignment.service';
import { PermissionsMatrixService } from './application/permissions-matrix.service';
import { Permission } from './domain/permission.entity';
import { PermissionAssignment } from './domain/permission-assignment.entity';
import { PERMISSION_ASSIGNMENT_REPOSITORY } from './domain/permission-assignment.repository';
import { PERMISSION_CATALOG_REPOSITORY } from './domain/permission-catalog.repository';
import { PERMISSION_REPOSITORY } from './domain/permission.repository';
import { Role } from './domain/role.entity';
import { PermissionCatalogSeeder } from './infrastructure/permission-catalog.seeder';
import { TypeOrmPermissionAssignmentRepository } from './infrastructure/typeorm-permission-assignment.repository';
import { TypeOrmPermissionCatalogRepository } from './infrastructure/typeorm-permission-catalog.repository';
import { TypeOrmPermissionRepository } from './infrastructure/typeorm-permission.repository';
import { OwnershipValidatorRegistry } from './ownership/ownership-validator-registry';

@Module({
  imports: [TypeOrmModule.forFeature([Membership, Role, Permission, PermissionAssignment])],
  providers: [
    { provide: PERMISSION_REPOSITORY, useClass: TypeOrmPermissionRepository },
    { provide: PERMISSION_ASSIGNMENT_REPOSITORY, useClass: TypeOrmPermissionAssignmentRepository },
    { provide: PERMISSION_CATALOG_REPOSITORY, useClass: TypeOrmPermissionCatalogRepository },
    OrganizationPermissionService,
    OwnershipContextService,
    OwnershipValidatorRegistry,
    PermissionAssignmentService,
    PermissionsMatrixService,
    PermissionCatalogSeeder,
    PermissionGuard,
  ],
  exports: [
    OrganizationPermissionService,
    OwnershipContextService,
    OwnershipValidatorRegistry,
    PermissionAssignmentService,
    PermissionsMatrixService,
    PermissionGuard,
  ],
})
export class PermissionsModule {}
