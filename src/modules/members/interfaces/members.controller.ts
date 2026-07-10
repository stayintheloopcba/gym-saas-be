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
  ApiCreatedResponse,
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
import { ErrorResponseModel, MemberModel } from '../../../common/openapi/api-models';
import { ACCESS_TOKEN_SECURITY, ACTIVE_GYM_SECURITY } from '../../../config/openapi.config';
import { CurrentUser } from '../../auth/interfaces/current-user.decorator';
import { JwtAuthGuard } from '../../auth/interfaces/jwt-auth.guard';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import type { UserPublicProfile } from '../../users/application/user-public-profile';
import { ChangeMemberRoleUseCase } from '../application/change-member-role.use-case';
import { CreateMemberUseCase } from '../application/create-member.use-case';
import { GetMemberUseCase } from '../application/get-member.use-case';
import { GrantPortalAccessUseCase } from '../application/grant-portal-access.use-case';
import { ListMembersUseCase } from '../application/list-members.use-case';
import { RemoveMemberUseCase } from '../application/remove-member.use-case';
import { UpdateMemberUseCase } from '../application/update-member.use-case';
import { CreateMemberDto } from './dto/create-member.dto';
import { LinkUserDto } from './dto/link-user.dto';
import { ListMembersQueryDto } from './dto/list-members-query.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { MemberView } from './member.view';

/**
 * Endpoints de members de un gym, montados en `gyms/:id/members`.
 *
 * Reemplazan a los antiguos endpoints de `memberships` (list/remove/change-role
 * seguían montados en la misma ruta) — ver nota de la tarea 5 en
 * `4-implementation/gym-saas-be.md` sobre por qué ese controller viejo se
 * desmontó en simultáneo para evitar un choque de rutas.
 */
@Controller('gyms/:id/members')
@UseGuards(JwtAuthGuard, ActiveGymGuard, PermissionGuard)
@UseFilters(DomainExceptionFilter)
@ApiTags('Members')
@ApiCookieAuth(ACCESS_TOKEN_SECURITY)
@ApiCookieAuth(ACTIVE_GYM_SECURITY)
export class MembersController {
  constructor(
    private readonly createMember: CreateMemberUseCase,
    private readonly listMembers: ListMembersUseCase,
    private readonly getMember: GetMemberUseCase,
    private readonly updateMember: UpdateMemberUseCase,
    private readonly removeMember: RemoveMemberUseCase,
    private readonly changeMemberRole: ChangeMemberRoleUseCase,
    private readonly grantPortalAccess: GrantPortalAccessUseCase,
  ) {}

  @Post()
  @RequirePermissions(PERMISSIONS.MEMBERS_CREATE)
  @ApiOperation({ summary: 'Register a member (person data only, no account required)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiCreatedResponse({ type: MemberModel })
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  @ApiConflictResponse({ type: ErrorResponseModel })
  async create(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) gymId: string,
    @Body() dto: CreateMemberDto,
  ): Promise<MemberView> {
    const member = await this.createMember.execute({ callerUserId: user.id, gymId, ...dto });
    return this.getMember.execute(user.id, gymId, member.id);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.MEMBERS_READ)
  @ApiOperation({ summary: 'List members of the gym, with optional filters' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: MemberModel, isArray: true })
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  list(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) gymId: string,
    @Query() query: ListMembersQueryDto,
  ): Promise<MemberView[]> {
    return this.listMembers.execute(user.id, gymId, query);
  }

  @Get(':memberId')
  @RequirePermissions(PERMISSIONS.MEMBERS_READ)
  @ApiOperation({ summary: 'Get a member by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'memberId', format: 'uuid' })
  @ApiOkResponse({ type: MemberModel })
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  @ApiNotFoundResponse({ type: ErrorResponseModel })
  getById(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) gymId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
  ): Promise<MemberView> {
    return this.getMember.execute(user.id, gymId, memberId);
  }

  @Patch(':memberId')
  @RequirePermissions(PERMISSIONS.MEMBERS_UPDATE)
  @ApiOperation({ summary: "Update a member's personal data" })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'memberId', format: 'uuid' })
  @ApiBody({ type: UpdateMemberDto })
  @ApiOkResponse({ type: MemberModel })
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  @ApiNotFoundResponse({ type: ErrorResponseModel })
  @ApiConflictResponse({ type: ErrorResponseModel })
  update(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) gymId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body() dto: UpdateMemberDto,
  ): Promise<MemberView> {
    return this.updateMember.execute({ callerUserId: user.id, gymId, memberId, ...dto });
  }

  @Patch(':memberId/role')
  @RequirePermissions(PERMISSIONS.MEMBERS_UPDATE_ROLE)
  @ApiOperation({ summary: "Change a member's role" })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'memberId', format: 'uuid' })
  @ApiBody({ type: UpdateMemberRoleDto })
  @ApiOkResponse({ type: MemberModel })
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  @ApiNotFoundResponse({ type: ErrorResponseModel })
  @ApiConflictResponse({ type: ErrorResponseModel })
  changeRole(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) gymId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body() dto: UpdateMemberRoleDto,
  ): Promise<MemberView> {
    return this.changeMemberRole.execute({ callerUserId: user.id, gymId, memberId, roleId: dto.roleId });
  }

  @Post(':memberId/user')
  @RequirePermissions(PERMISSIONS.MEMBERS_UPDATE)
  @ApiOperation({ summary: 'Grant portal access: link an existing account by email, or create one' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'memberId', format: 'uuid' })
  @ApiBody({ type: LinkUserDto })
  @ApiOkResponse({ type: MemberModel })
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  @ApiNotFoundResponse({ type: ErrorResponseModel })
  @ApiConflictResponse({ type: ErrorResponseModel })
  linkUser(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) gymId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body() dto: LinkUserDto,
  ): Promise<MemberView> {
    return this.grantPortalAccess.execute({ callerUserId: user.id, gymId, memberId, email: dto.email });
  }

  @Delete(':memberId')
  @RequirePermissions(PERMISSIONS.MEMBERS_REMOVE)
  @ApiOperation({ summary: 'Soft-delete a member' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'memberId', format: 'uuid' })
  @ApiNoContentResponse()
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  @ApiNotFoundResponse({ type: ErrorResponseModel })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) gymId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
  ): Promise<void> {
    await this.removeMember.execute(user.id, gymId, memberId);
  }
}
