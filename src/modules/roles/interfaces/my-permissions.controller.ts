import { Controller, ForbiddenException, Get, Param, ParseUUIDPipe, UseFilters, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { DomainExceptionFilter } from '../../../common/errors/domain-exception.filter';
import { ActiveOrgGuard } from '../../../common/guards/active-org.guard';
import { PermissionGuard } from '../../../common/guards/permission.guard';
import { MyPermissionsModel } from '../../../common/openapi/api-models';
import { ACCESS_TOKEN_SECURITY, ACTIVE_ORG_SECURITY } from '../../../config/openapi.config';
import { CurrentUser } from '../../auth/interfaces/current-user.decorator';
import { JwtAuthGuard } from '../../auth/interfaces/jwt-auth.guard';
import { OrganizationPermissionService } from '../../permissions/application/organization-permission.service';
import type { UserPublicProfile } from '../../users/application/user-public-profile';

/**
 * Permisos efectivos del usuario autenticado en la organización activa.
 *
 * A diferencia del resto de endpoints de administración, NO exige un permiso
 * concreto: cualquier miembro de la organización puede leer sus propios
 * permisos. El `ActiveOrgGuard` ya garantiza que el `:id` del path coincida con
 * la organización activa del request, así que un usuario solo ve los suyos.
 */
@Controller('organizations/:id/me')
@UseGuards(JwtAuthGuard, ActiveOrgGuard, PermissionGuard)
@UseFilters(DomainExceptionFilter)
@ApiTags('Permissions')
@ApiCookieAuth(ACCESS_TOKEN_SECURITY)
@ApiCookieAuth(ACTIVE_ORG_SECURITY)
export class MyPermissionsController {
  constructor(private readonly permissions: OrganizationPermissionService) {}

  @Get('permissions')
  @ApiOperation({ summary: "Get the current user's effective permissions in the active organization" })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: MyPermissionsModel })
  async myPermissions(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) organizationId: string,
  ): Promise<MyPermissionsModel> {
    const effective = await this.permissions.getEffectivePermissions(user.id, organizationId);
    if (!effective) {
      throw new ForbiddenException('Active organization membership was not found');
    }

    return {
      organizationId,
      role: effective.role,
      hierarchyLevel: effective.hierarchyLevel,
      permissions: [...effective.permissions],
    };
  }
}
