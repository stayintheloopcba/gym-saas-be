import { Controller, Get, Inject, UseFilters, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DomainExceptionFilter } from '../../../common/errors/domain-exception.filter';
import { PermissionInfoModel } from '../../../common/openapi/api-models';
import { ACCESS_TOKEN_SECURITY } from '../../../config/openapi.config';
import { JwtAuthGuard } from '../../auth/interfaces/jwt-auth.guard';
import { PERMISSION_CATALOG_REPOSITORY } from '../../permissions/domain/permission-catalog.repository';
import type { PermissionCatalogRepository } from '../../permissions/domain/permission-catalog.repository';
import { PlatformAdminGuard } from '../../platform-admin/interfaces/platform-admin.guard';

/** Catálogo de códigos de permiso, para la UI de administración de roles. */
@Controller('admin/permissions')
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
@UseFilters(DomainExceptionFilter)
@ApiTags('Admin Roles')
@ApiCookieAuth(ACCESS_TOKEN_SECURITY)
export class AdminPermissionsController {
  constructor(@Inject(PERMISSION_CATALOG_REPOSITORY) private readonly catalog: PermissionCatalogRepository) {}

  @Get()
  @ApiOperation({ summary: 'List the permission-code catalog' })
  @ApiOkResponse({ type: PermissionInfoModel, isArray: true })
  async list(): Promise<PermissionInfoModel[]> {
    const permissions = await this.catalog.listActive();
    return permissions.map((permission) => ({
      code: permission.code,
      name: permission.name,
      description: permission.description,
    }));
  }
}
