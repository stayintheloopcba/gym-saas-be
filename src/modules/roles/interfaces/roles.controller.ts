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
  Put,
  Query,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { DomainExceptionFilter } from '../../../common/errors/domain-exception.filter';
import { ActiveOrgGuard } from '../../../common/guards/active-org.guard';
import { PermissionGuard } from '../../../common/guards/permission.guard';
import { RoleViewModel } from '../../../common/openapi/api-models';
import { OrganizationMemberModel } from '../../../common/openapi/api-models';
import { ACCESS_TOKEN_SECURITY, ACTIVE_ORG_SECURITY } from '../../../config/openapi.config';
import { CurrentUser } from '../../auth/interfaces/current-user.decorator';
import { JwtAuthGuard } from '../../auth/interfaces/jwt-auth.guard';
import { PermissionAssignmentService } from '../../permissions/application/permission-assignment.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import type { UserPublicProfile } from '../../users/application/user-public-profile';
import { CreateRoleUseCase } from '../application/create-role.use-case';
import { AssignMemberCustomRoleUseCase } from '../application/assign-member-custom-role.use-case';
import { DeleteRoleUseCase } from '../application/delete-role.use-case';
import { ListRolesUseCase } from '../application/list-roles.use-case';
import { UpdateRoleUseCase } from '../application/update-role.use-case';
import { AssignPermissionDto } from './dto/assign-permission.dto';
import { BulkAssignPermissionsDto } from './dto/bulk-assign-permissions.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleView, toRoleView } from './role.view';

@Controller('organizations/:id/roles')
@UseGuards(JwtAuthGuard, ActiveOrgGuard, PermissionGuard)
@UseFilters(DomainExceptionFilter)
@ApiTags('Roles')
@ApiCookieAuth(ACCESS_TOKEN_SECURITY)
@ApiCookieAuth(ACTIVE_ORG_SECURITY)
export class RolesController {
  constructor(
    private readonly createRole: CreateRoleUseCase,
    private readonly assignMemberCustomRole: AssignMemberCustomRoleUseCase,
    private readonly listRoles: ListRolesUseCase,
    private readonly updateRole: UpdateRoleUseCase,
    private readonly deleteRole: DeleteRoleUseCase,
    private readonly assignments: PermissionAssignmentService,
  ) {}

  @Put(':roleId/members/:userId')
  @RequirePermissions(PERMISSIONS.MEMBERS_UPDATE_ROLE)
  @ApiOperation({ summary: 'Assign a custom role to a member' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'roleId', format: 'uuid' })
  @ApiParam({ name: 'userId', format: 'uuid' })
  @ApiOkResponse({ type: OrganizationMemberModel })
  assignMember(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) organizationId: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Param('userId', ParseUUIDPipe) targetUserId: string,
  ) {
    return this.assignMemberCustomRole.execute({
      callerUserId: user.id,
      organizationId,
      targetUserId,
      roleId,
    });
  }

  @Delete('assignments/:userId')
  @RequirePermissions(PERMISSIONS.MEMBERS_UPDATE_ROLE)
  @ApiOperation({ summary: 'Clear the custom role assigned to a member' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'userId', format: 'uuid' })
  @ApiOkResponse({ type: OrganizationMemberModel })
  clearMemberAssignment(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) organizationId: string,
    @Param('userId', ParseUUIDPipe) targetUserId: string,
  ) {
    return this.assignMemberCustomRole.execute({
      callerUserId: user.id,
      organizationId,
      targetUserId,
      roleId: null,
    });
  }

  @Post()
  @RequirePermissions(PERMISSIONS.ROLES_CREATE)
  @ApiOperation({ summary: 'Create a custom role in the active organization' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiCreatedResponse({ type: RoleViewModel })
  async create(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) organizationId: string,
    @Body() dto: CreateRoleDto,
  ): Promise<RoleView> {
    const role = await this.createRole.execute({ callerUserId: user.id, organizationId, ...dto });
    return toRoleView(role);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.ROLES_READ)
  @ApiOperation({ summary: 'List system and custom roles of the active organization' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: RoleViewModel, isArray: true })
  async list(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) organizationId: string,
  ): Promise<RoleView[]> {
    const roles = await this.listRoles.execute(user.id, organizationId);
    return roles.map(toRoleView);
  }

  @Patch(':roleId')
  @RequirePermissions(PERMISSIONS.ROLES_UPDATE)
  @ApiOperation({ summary: 'Update a custom role' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'roleId', format: 'uuid' })
  @ApiOkResponse({ type: RoleViewModel })
  async update(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) organizationId: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Body() dto: UpdateRoleDto,
  ): Promise<RoleView> {
    const role = await this.updateRole.execute({ callerUserId: user.id, organizationId, roleId, ...dto });
    return toRoleView(role);
  }

  @Delete(':roleId')
  @RequirePermissions(PERMISSIONS.ROLES_DELETE)
  @ApiOperation({ summary: 'Delete a custom role (must not be in use)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'roleId', format: 'uuid' })
  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) organizationId: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
  ): Promise<void> {
    await this.deleteRole.execute(user.id, organizationId, roleId);
  }

  @Put(':roleId/permissions')
  @RequirePermissions(PERMISSIONS.PERMISSIONS_MANAGE)
  @ApiOperation({ summary: 'Bulk assign/deny permissions to a role' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'roleId', format: 'uuid' })
  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  async bulkAssign(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) organizationId: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Body() dto: BulkAssignPermissionsDto,
  ): Promise<void> {
    await this.assignments.bulkAssignToRole(user.id, organizationId, roleId, dto.permissions);
  }

  @Post(':roleId/permissions')
  @RequirePermissions(PERMISSIONS.PERMISSIONS_MANAGE)
  @ApiOperation({ summary: 'Assign or deny a single permission to a role' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'roleId', format: 'uuid' })
  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  async assign(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) organizationId: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Body() dto: AssignPermissionDto,
  ): Promise<void> {
    await this.assignments.assignToRole(user.id, organizationId, roleId, dto);
  }

  @Delete(':roleId/permissions')
  @RequirePermissions(PERMISSIONS.PERMISSIONS_MANAGE)
  @ApiOperation({ summary: 'Remove a permission assignment from a role' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'roleId', format: 'uuid' })
  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  async unassign(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) organizationId: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Query('code') permissionCode: string,
  ): Promise<void> {
    await this.assignments.unassignFromRole(user.id, organizationId, roleId, permissionCode);
  }
}
