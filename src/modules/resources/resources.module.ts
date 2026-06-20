import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsModule } from '../permissions/permissions.module';
import { CreateResourceUseCase } from './application/create-resource.use-case';
import { DeleteResourceUseCase } from './application/delete-resource.use-case';
import { GetResourceUseCase } from './application/get-resource.use-case';
import { ListResourcesUseCase } from './application/list-resources.use-case';
import { UpdateResourceUseCase } from './application/update-resource.use-case';
import { Resource } from './domain/resource.entity';
import { RESOURCE_REPOSITORY } from './domain/resource.repository';
import { ResourceOwnershipRegistrar } from './infrastructure/resource-ownership.registrar';
import { TypeOrmResourceRepository } from './infrastructure/typeorm-resource.repository';
import { ResourcesController } from './interfaces/resources.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Resource]), PermissionsModule],
  controllers: [ResourcesController],
  providers: [
    { provide: RESOURCE_REPOSITORY, useClass: TypeOrmResourceRepository },
    CreateResourceUseCase,
    ListResourcesUseCase,
    GetResourceUseCase,
    UpdateResourceUseCase,
    DeleteResourceUseCase,
    ResourceOwnershipRegistrar,
  ],
})
export class ResourcesModule {}
