import { Controller, Get, Param, ParseUUIDPipe, UseFilters, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { DomainExceptionFilter } from '../../../common/errors/domain-exception.filter';
import { ActiveOrgGuard } from '../../../common/guards/active-org.guard';
import { PermissionGuard } from '../../../common/guards/permission.guard';
import { RoleViewModel } from '../../../common/openapi/api-models';
import { ACCESS_TOKEN_SECURITY, ACTIVE_ORG_SECURITY } from '../../../config/openapi.config';
import { CurrentUser } from '../../auth/interfaces/current-user.decorator';
import { JwtAuthGuard } from '../../auth/interfaces/jwt-auth.guard';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import type { UserPublicProfile } from '../../users/application/user-public-profile';
import { ListRolesUseCase } from '../application/list-roles.use-case';
import { RoleView, toRoleView } from './role.view';

/**
 * Listado de solo lectura del catálogo global de roles, para que los
 * miembros de una organización puedan elegir un rol al invitar o cambiar el
 * rol de un miembro. La administración del catálogo vive en `/admin/roles`.
 */
@Controller('organizations/:id/roles')
@UseGuards(JwtAuthGuard, ActiveOrgGuard, PermissionGuard)
@UseFilters(DomainExceptionFilter)
@ApiTags('Roles')
@ApiCookieAuth(ACCESS_TOKEN_SECURITY)
@ApiCookieAuth(ACTIVE_ORG_SECURITY)
export class RolesController {
  constructor(private readonly listRoles: ListRolesUseCase) {}

  @Get()
  @RequirePermissions(PERMISSIONS.ROLES_READ)
  @ApiOperation({ summary: 'List the global role catalog' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: RoleViewModel, isArray: true })
  async list(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) organizationId: string,
  ): Promise<RoleView[]> {
    const roles = await this.listRoles.execute(user.id, organizationId);
    return roles.map(toRoleView);
  }
}
