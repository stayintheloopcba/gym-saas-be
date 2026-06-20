import { Controller, Get, Inject, Param, ParseUUIDPipe, Query, UseFilters, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { DomainExceptionFilter } from '../../../common/errors/domain-exception.filter';
import { ActiveOrgGuard } from '../../../common/guards/active-org.guard';
import { PermissionGuard } from '../../../common/guards/permission.guard';
import { PermissionInfoModel, PermissionMatrixModel } from '../../../common/openapi/api-models';
import { ACCESS_TOKEN_SECURITY, ACTIVE_ORG_SECURITY } from '../../../config/openapi.config';
import { CurrentUser } from '../../auth/interfaces/current-user.decorator';
import { JwtAuthGuard } from '../../auth/interfaces/jwt-auth.guard';
import { PermissionsMatrixService } from '../../permissions/application/permissions-matrix.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import type { UserPublicProfile } from '../../users/application/user-public-profile';
import { ROLE_REPOSITORY } from '../domain/role.repository';
import type { RoleRepository } from '../domain/role.repository';
import { GetMatrixQueryDto } from './dto/get-matrix-query.dto';
import { toRoleView } from './role.view';

/** Permiso de lectura de administración: gestionar permisos o leer roles. */
const ADMIN_READ = [PERMISSIONS.PERMISSIONS_MANAGE, PERMISSIONS.ROLES_READ];

@Controller('organizations/:id/permissions')
@UseGuards(JwtAuthGuard, ActiveOrgGuard, PermissionGuard)
@UseFilters(DomainExceptionFilter)
@ApiTags('Permissions')
@ApiCookieAuth(ACCESS_TOKEN_SECURITY)
@ApiCookieAuth(ACTIVE_ORG_SECURITY)
export class PermissionAdminController {
  constructor(
    private readonly matrix: PermissionsMatrixService,
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
  ) {}

  @Get('catalog')
  @RequirePermissions(ADMIN_READ)
  @ApiOperation({ summary: 'List the available permissions catalog' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: PermissionInfoModel, isArray: true })
  async catalog(@CurrentUser() user: UserPublicProfile, @Param('id', ParseUUIDPipe) organizationId: string) {
    const permissions = await this.matrix.listCatalog(user.id, organizationId);
    return permissions.map((permission) => ({
      code: permission.code,
      name: permission.name,
      description: permission.description,
    }));
  }

  @Get('matrix')
  @RequirePermissions(ADMIN_READ)
  @ApiOperation({ summary: 'Get the roles × permissions matrix of the active organization' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: PermissionMatrixModel })
  async getMatrix(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) organizationId: string,
    @Query() query: GetMatrixQueryDto,
  ) {
    const roles = await this.roles.listForOrganization(organizationId);
    const result = await this.matrix.getMatrix(user.id, organizationId, roles, query.resource);
    return {
      roles: result.roles.map(toRoleView),
      permissions: result.permissions.map((permission) => ({
        code: permission.code,
        name: permission.name,
        description: permission.description,
      })),
      assignments: result.assignments,
    };
  }
}
