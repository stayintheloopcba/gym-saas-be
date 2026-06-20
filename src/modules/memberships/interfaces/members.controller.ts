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
  Post,
  Query,
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
import { ActiveOrgGuard } from '../../../common/guards/active-org.guard';
import { PermissionGuard } from '../../../common/guards/permission.guard';
import { ErrorResponseModel, OrganizationMemberModel } from '../../../common/openapi/api-models';
import { ACCESS_TOKEN_SECURITY, ACTIVE_ORG_SECURITY } from '../../../config/openapi.config';
import { CurrentUser } from '../../auth/interfaces/current-user.decorator';
import { JwtAuthGuard } from '../../auth/interfaces/jwt-auth.guard';
import { PermissionAssignmentService } from '../../permissions/application/permission-assignment.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import type { UserPublicProfile } from '../../users/application/user-public-profile';
import { ChangeMemberRoleUseCase } from '../application/change-member-role.use-case';
import { ListOrganizationMembersUseCase, OrganizationMember } from '../application/list-organization-members.use-case';
import { RemoveMemberUseCase } from '../application/remove-member.use-case';
import { AssignMemberPermissionDto } from './dto/assign-member-permission.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';

/**
 * Endpoints de miembros de una organización, montados en `organizations/:id/members`.
 *
 * Son rutas de negocio org-scoped: exigen JWT + `ActiveOrgGuard`, que además
 * verifica que el `:id` del path coincida con la organización activa del request.
 */
@Controller('organizations/:id/members')
@UseGuards(JwtAuthGuard, ActiveOrgGuard, PermissionGuard)
@UseFilters(DomainExceptionFilter)
@ApiTags('Members')
@ApiCookieAuth(ACCESS_TOKEN_SECURITY)
@ApiCookieAuth(ACTIVE_ORG_SECURITY)
export class MembersController {
  constructor(
    private readonly listMembers: ListOrganizationMembersUseCase,
    private readonly removeMember: RemoveMemberUseCase,
    private readonly changeMemberRole: ChangeMemberRoleUseCase,
    private readonly permissionAssignments: PermissionAssignmentService,
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS.MEMBERS_READ)
  @ApiOperation({ summary: 'List active members of the selected organization' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: OrganizationMemberModel, isArray: true })
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  list(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) organizationId: string,
  ): Promise<OrganizationMember[]> {
    return this.listMembers.execute(user.id, organizationId);
  }

  @Patch(':userId/role')
  @RequirePermissions(PERMISSIONS.MEMBERS_UPDATE_ROLE)
  @ApiOperation({ summary: "Change a member's role in the selected organization" })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'userId', format: 'uuid' })
  @ApiBody({ type: UpdateMemberRoleDto })
  @ApiOkResponse({ type: OrganizationMemberModel })
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  @ApiNotFoundResponse({ type: ErrorResponseModel })
  @ApiConflictResponse({ type: ErrorResponseModel })
  changeRole(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) organizationId: string,
    @Param('userId', ParseUUIDPipe) targetUserId: string,
    @Body() dto: UpdateMemberRoleDto,
  ): Promise<OrganizationMember> {
    return this.changeMemberRole.execute({
      callerUserId: user.id,
      organizationId,
      targetUserId,
      role: dto.role,
    });
  }

  @Delete(':userId')
  @RequirePermissions(PERMISSIONS.MEMBERS_REMOVE)
  @ApiOperation({ summary: 'Remove a member from the selected organization' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'userId', format: 'uuid' })
  @ApiNoContentResponse()
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  @ApiNotFoundResponse({ type: ErrorResponseModel })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) organizationId: string,
    @Param('userId', ParseUUIDPipe) targetUserId: string,
  ): Promise<void> {
    await this.removeMember.execute({ callerUserId: user.id, organizationId, targetUserId });
  }

  @Post(':userId/permissions')
  @RequirePermissions(PERMISSIONS.PERMISSIONS_MANAGE)
  @ApiOperation({ summary: 'Grant or deny a permission to a member (overrides their role)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'userId', format: 'uuid' })
  @ApiBody({ type: AssignMemberPermissionDto })
  @ApiNoContentResponse()
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  @HttpCode(HttpStatus.NO_CONTENT)
  async assignPermission(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) organizationId: string,
    @Param('userId', ParseUUIDPipe) targetUserId: string,
    @Body() dto: AssignMemberPermissionDto,
  ): Promise<void> {
    await this.permissionAssignments.assignToUser(user.id, organizationId, targetUserId, dto);
  }

  @Delete(':userId/permissions')
  @RequirePermissions(PERMISSIONS.PERMISSIONS_MANAGE)
  @ApiOperation({ summary: 'Remove a permission override from a member' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'userId', format: 'uuid' })
  @ApiNoContentResponse()
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  @HttpCode(HttpStatus.NO_CONTENT)
  async unassignPermission(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) organizationId: string,
    @Param('userId', ParseUUIDPipe) targetUserId: string,
    @Query('code') permissionCode: string,
  ): Promise<void> {
    await this.permissionAssignments.unassignFromUser(user.id, organizationId, targetUserId, permissionCode);
  }
}
