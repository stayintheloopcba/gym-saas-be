import { Controller, ForbiddenException, Get, Param, ParseUUIDPipe, UseFilters, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { DomainExceptionFilter } from '../../../common/errors/domain-exception.filter';
import { ActiveGymGuard } from '../../../common/guards/active-gym.guard';
import { PermissionGuard } from '../../../common/guards/permission.guard';
import { MyPermissionsModel } from '../../../common/openapi/api-models';
import { ACCESS_TOKEN_SECURITY, ACTIVE_GYM_SECURITY } from '../../../config/openapi.config';
import { CurrentUser } from '../../auth/interfaces/current-user.decorator';
import { JwtAuthGuard } from '../../auth/interfaces/jwt-auth.guard';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import type { UserPublicProfile } from '../../users/application/user-public-profile';

/**
 * Permisos efectivos del usuario autenticado en la organización activa.
 *
 * A diferencia del resto de endpoints de administración, NO exige un permiso
 * concreto: cualquier miembro de la organización puede leer sus propios
 * permisos. El `ActiveGymGuard` ya garantiza que el `:id` del path coincida con
 * la organización activa del request, así que un usuario solo ve los suyos.
 */
@Controller('gyms/:id/me')
@UseGuards(JwtAuthGuard, ActiveGymGuard, PermissionGuard)
@UseFilters(DomainExceptionFilter)
@ApiTags('Permissions')
@ApiCookieAuth(ACCESS_TOKEN_SECURITY)
@ApiCookieAuth(ACTIVE_GYM_SECURITY)
export class MyPermissionsController {
  constructor(private readonly permissions: GymPermissionService) {}

  @Get('permissions')
  @ApiOperation({ summary: "Get the current user's effective permissions in the active gym" })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: MyPermissionsModel })
  async myPermissions(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) gymId: string,
  ): Promise<MyPermissionsModel> {
    const effective = await this.permissions.getEffectivePermissions(user.id, gymId);
    if (!effective) {
      throw new ForbiddenException('Active gym membership was not found');
    }

    return {
      gymId,
      role: effective.role,
      hierarchyLevel: effective.hierarchyLevel,
      permissions: [...effective.permissions],
    };
  }
}
