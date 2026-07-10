import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { DomainExceptionFilter } from '../../../common/errors/domain-exception.filter';
import { ActiveGymGuard } from '../../../common/guards/active-gym.guard';
import { PermissionGuard } from '../../../common/guards/permission.guard';
import { ErrorResponseModel, GymMemberModel } from '../../../common/openapi/api-models';
import { ACCESS_TOKEN_SECURITY, ACTIVE_GYM_SECURITY } from '../../../config/openapi.config';
import { CurrentUser } from '../../auth/interfaces/current-user.decorator';
import { JwtAuthGuard } from '../../auth/interfaces/jwt-auth.guard';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import type { UserPublicProfile } from '../../users/application/user-public-profile';
import { ChangeMemberRoleUseCase } from '../application/change-member-role.use-case';
import { ListGymMembersUseCase, GymMember } from '../application/list-gym-members.use-case';
import { RemoveMemberUseCase } from '../application/remove-member.use-case';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';

/**
 * Endpoints de miembros de una organización, montados en `gyms/:id/members`.
 *
 * Son rutas de negocio org-scoped: exigen JWT + `ActiveGymGuard`, que además
 * verifica que el `:id` del path coincida con la organización activa del request.
 */
@Controller('gyms/:id/members')
@UseGuards(JwtAuthGuard, ActiveGymGuard, PermissionGuard)
@UseFilters(DomainExceptionFilter)
@ApiTags('Members')
@ApiCookieAuth(ACCESS_TOKEN_SECURITY)
@ApiCookieAuth(ACTIVE_GYM_SECURITY)
export class MembersController {
  constructor(
    private readonly listMembers: ListGymMembersUseCase,
    private readonly removeMember: RemoveMemberUseCase,
    private readonly changeMemberRole: ChangeMemberRoleUseCase,
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS.MEMBERS_READ)
  @ApiOperation({ summary: 'List active members of the selected gym' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: GymMemberModel, isArray: true })
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  list(@CurrentUser() user: UserPublicProfile, @Param('id', ParseUUIDPipe) gymId: string): Promise<GymMember[]> {
    return this.listMembers.execute(user.id, gymId);
  }

  @Patch(':userId/role')
  @RequirePermissions(PERMISSIONS.MEMBERS_UPDATE_ROLE)
  @ApiOperation({ summary: "Change a member's role in the selected gym" })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'userId', format: 'uuid' })
  @ApiBody({ type: UpdateMemberRoleDto })
  @ApiOkResponse({ type: GymMemberModel })
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  @ApiNotFoundResponse({ type: ErrorResponseModel })
  @ApiConflictResponse({ type: ErrorResponseModel })
  changeRole(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) gymId: string,
    @Param('userId', ParseUUIDPipe) targetUserId: string,
    @Body() dto: UpdateMemberRoleDto,
  ): Promise<GymMember> {
    return this.changeMemberRole.execute({
      callerUserId: user.id,
      gymId,
      targetUserId,
      roleId: dto.roleId,
    });
  }

  @Delete(':userId')
  @RequirePermissions(PERMISSIONS.MEMBERS_REMOVE)
  @ApiOperation({ summary: 'Remove a member from the selected gym' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'userId', format: 'uuid' })
  @ApiNoContentResponse()
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  @ApiNotFoundResponse({ type: ErrorResponseModel })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) gymId: string,
    @Param('userId', ParseUUIDPipe) targetUserId: string,
  ): Promise<void> {
    await this.removeMember.execute({ callerUserId: user.id, gymId, targetUserId });
  }
}
