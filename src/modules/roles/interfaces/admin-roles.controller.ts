import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
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
import { DomainExceptionFilter } from '../../../common/errors/domain-exception.filter';
import { RoleViewModel } from '../../../common/openapi/api-models';
import { ACCESS_TOKEN_SECURITY } from '../../../config/openapi.config';
import { JwtAuthGuard } from '../../auth/interfaces/jwt-auth.guard';
import { PlatformAdminGuard } from '../../platform-admin/interfaces/platform-admin.guard';
import { CreateRoleUseCase } from '../application/create-role.use-case';
import { DeleteRoleUseCase } from '../application/delete-role.use-case';
import { ReplaceRolePermissionsUseCase } from '../application/replace-role-permissions.use-case';
import { UpdateRoleUseCase } from '../application/update-role.use-case';
import { ROLE_REPOSITORY } from '../domain/role.repository';
import type { RoleRepository } from '../domain/role.repository';
import { CreateRoleDto } from './dto/create-role.dto';
import { ReplaceRolePermissionsDto } from './dto/replace-role-permissions.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleView, toRoleView } from './role.view';

/**
 * Administración del catálogo global de roles. Solo platform admins
 * (`PlatformAdminGuard`), sin `ActiveOrgGuard`/`PermissionGuard`: no es una
 * superficie org-scoped.
 */
@Controller('admin/roles')
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
@UseFilters(DomainExceptionFilter)
@ApiTags('Admin Roles')
@ApiCookieAuth(ACCESS_TOKEN_SECURITY)
export class AdminRolesController {
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
    private readonly createRole: CreateRoleUseCase,
    private readonly updateRole: UpdateRoleUseCase,
    private readonly deleteRole: DeleteRoleUseCase,
    private readonly replaceRolePermissions: ReplaceRolePermissionsUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List the global role catalog' })
  @ApiOkResponse({ type: RoleViewModel, isArray: true })
  async list(): Promise<RoleView[]> {
    const roles = await this.roles.listAll();
    return roles.map(toRoleView);
  }

  @Post()
  @ApiOperation({ summary: 'Create a role in the global catalog' })
  @ApiCreatedResponse({ type: RoleViewModel })
  async create(@Body() dto: CreateRoleDto): Promise<RoleView> {
    const role = await this.createRole.execute(dto);
    return toRoleView(role);
  }

  @Patch(':roleId')
  @ApiOperation({ summary: 'Update a role (name, description, hierarchyLevel — key is immutable)' })
  @ApiParam({ name: 'roleId', format: 'uuid' })
  @ApiOkResponse({ type: RoleViewModel })
  async update(@Param('roleId', ParseUUIDPipe) roleId: string, @Body() dto: UpdateRoleDto): Promise<RoleView> {
    const role = await this.updateRole.execute({ roleId, ...dto });
    return toRoleView(role);
  }

  @Delete(':roleId')
  @ApiOperation({ summary: 'Delete a role (must not be the owner role nor in use)' })
  @ApiParam({ name: 'roleId', format: 'uuid' })
  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('roleId', ParseUUIDPipe) roleId: string): Promise<void> {
    await this.deleteRole.execute(roleId);
  }

  @Put(':roleId/permissions')
  @ApiOperation({ summary: "Replace a role's full permission set" })
  @ApiParam({ name: 'roleId', format: 'uuid' })
  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  async replacePermissions(
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Body() dto: ReplaceRolePermissionsDto,
  ): Promise<void> {
    await this.replaceRolePermissions.execute({ roleId, permissionCodes: dto.permissionCodes });
  }
}
