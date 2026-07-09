import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembershipsModule } from '../memberships/memberships.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { StorageModule } from '../storage/storage.module';
import { CreateOrganizationUseCase } from './application/create-organization.use-case';
import { DeleteOrganizationUseCase } from './application/delete-organization.use-case';
import { GetOnboardingStatusUseCase } from './application/get-onboarding-status.use-case';
import { GetOrganizationUseCase } from './application/get-organization.use-case';
import { ListMyOrganizationsUseCase } from './application/list-my-organizations.use-case';
import { ORG_UNIT_OF_WORK } from './application/org-unit-of-work.port';
import { SetOrganizationImageUseCase } from './application/set-organization-image.use-case';
import { UpdateOrganizationUseCase } from './application/update-organization.use-case';
import { Organization } from './domain/organization.entity';
import { ORGANIZATION_REPOSITORY } from './domain/organization.repository';
import { TypeOrmOrgUnitOfWork } from './infrastructure/typeorm-org-unit-of-work';
import { TypeOrmOrganizationRepository } from './infrastructure/typeorm-organization.repository';
import { ActiveOrgCookie } from './interfaces/active-org-cookie';
import { OnboardingController } from './interfaces/onboarding.controller';
import { OrganizationsController } from './interfaces/organizations.controller';

/**
 * Módulo de organizaciones (capas DDD). Importa memberships y permisos. Aloja
 * también el `OnboardingController`, parte de la capacidad `organization-context`.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Organization]), MembershipsModule, PermissionsModule, StorageModule],
  controllers: [OrganizationsController, OnboardingController],
  providers: [
    { provide: ORGANIZATION_REPOSITORY, useClass: TypeOrmOrganizationRepository },
    { provide: ORG_UNIT_OF_WORK, useClass: TypeOrmOrgUnitOfWork },
    CreateOrganizationUseCase,
    GetOrganizationUseCase,
    UpdateOrganizationUseCase,
    SetOrganizationImageUseCase,
    DeleteOrganizationUseCase,
    ListMyOrganizationsUseCase,
    GetOnboardingStatusUseCase,
    ActiveOrgCookie,
  ],
  // Exportados para que `AuthModule` provisione la organización en el registro
  // self-serve (crear org + setear la cookie de org activa).
  exports: [CreateOrganizationUseCase, ActiveOrgCookie],
})
export class OrganizationsModule {}
