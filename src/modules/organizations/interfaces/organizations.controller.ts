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
  Res,
  UploadedFile,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { DomainExceptionFilter } from '../../../common/errors/domain-exception.filter';
import { PermissionGuard } from '../../../common/guards/permission.guard';
import { ApiImageUpload } from '../../../common/openapi/api-image-upload.decorator';
import {
  ErrorResponseModel,
  OrganizationModel,
  OrganizationWithRoleModel,
  SuccessResponseModel,
} from '../../../common/openapi/api-models';
import { ACCESS_TOKEN_SECURITY } from '../../../config/openapi.config';
import {
  ApiBadRequestResponse,
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
import { CurrentUser } from '../../auth/interfaces/current-user.decorator';
import { JwtAuthGuard } from '../../auth/interfaces/jwt-auth.guard';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import type { UserPublicProfile } from '../../users/application/user-public-profile';
import { CreateOrganizationUseCase } from '../application/create-organization.use-case';
import { DeleteOrganizationUseCase } from '../application/delete-organization.use-case';
import { GetOrganizationUseCase } from '../application/get-organization.use-case';
import { ListMyOrganizationsUseCase } from '../application/list-my-organizations.use-case';
import { SetOrganizationImageUseCase } from '../application/set-organization-image.use-case';
import { UpdateOrganizationUseCase } from '../application/update-organization.use-case';
import { ActiveOrgCookie } from './active-org-cookie';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationView, OrganizationWithRoleView, toOrganizationView } from './organization.view';

/**
 * Endpoints de organizaciones y selección de organización activa.
 *
 * Todas las rutas exigen JWT (no `ActiveOrgGuard`): son rutas de cuenta/onboarding
 * — un usuario sin organización todavía necesita poder crear o listar las suyas.
 * La validación del par (usuario, org) la hacen el guard y los casos de uso
 * mediante permisos granulares.
 */
@Controller('organizations')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UseFilters(DomainExceptionFilter)
@ApiTags('Organizations')
@ApiCookieAuth(ACCESS_TOKEN_SECURITY)
export class OrganizationsController {
  constructor(
    private readonly createOrganization: CreateOrganizationUseCase,
    private readonly listMyOrganizations: ListMyOrganizationsUseCase,
    private readonly getOrganization: GetOrganizationUseCase,
    private readonly updateOrganization: UpdateOrganizationUseCase,
    private readonly setOrganizationImage: SetOrganizationImageUseCase,
    private readonly deleteOrganization: DeleteOrganizationUseCase,
    private readonly activeOrgCookie: ActiveOrgCookie,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create an organization and its owner membership' })
  @ApiCreatedResponse({ type: OrganizationModel })
  @ApiBadRequestResponse({ type: ErrorResponseModel })
  async create(
    @CurrentUser() user: UserPublicProfile,
    @Body() dto: CreateOrganizationDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<OrganizationView> {
    const organization = await this.createOrganization.execute({ ownerUserId: user.id, name: dto.name });
    // El creador queda como OWNER y la organización pasa a ser la activa.
    this.activeOrgCookie.set(res, organization.id);
    return toOrganizationView(organization);
  }

  @Get()
  @ApiOperation({ summary: 'List organizations for the authenticated user' })
  @ApiOkResponse({ type: OrganizationWithRoleModel, isArray: true })
  async listMine(@CurrentUser() user: UserPublicProfile): Promise<OrganizationWithRoleView[]> {
    const mine = await this.listMyOrganizations.execute(user.id);
    return mine.map(({ organization, role }) => ({ ...toOrganizationView(organization), role }));
  }

  @Post('select/clear')
  @ApiOperation({ summary: 'Clear the active organization cookie' })
  @ApiOkResponse({ type: SuccessResponseModel })
  @HttpCode(HttpStatus.OK)
  clearActive(@Res({ passthrough: true }) res: Response): { success: true } {
    this.activeOrgCookie.clear(res);
    return { success: true };
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.ORGANIZATION_READ)
  @ApiOperation({ summary: 'Get an organization where the user is an active member' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: OrganizationModel })
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  @ApiNotFoundResponse({ type: ErrorResponseModel })
  async getById(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OrganizationView> {
    return toOrganizationView(await this.getOrganization.execute(user.id, id));
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.ORGANIZATION_UPDATE)
  @ApiOperation({ summary: 'Update an organization name and/or branding' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: OrganizationModel })
  @ApiBadRequestResponse({ type: ErrorResponseModel })
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  @ApiNotFoundResponse({ type: ErrorResponseModel })
  async update(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrganizationDto,
  ): Promise<OrganizationView> {
    return toOrganizationView(await this.updateOrganization.execute(user.id, id, dto));
  }

  @Post(':id/logo')
  @RequirePermissions(PERMISSIONS.ORGANIZATION_UPDATE)
  @ApiImageUpload()
  @ApiOperation({ summary: "Upload the organization's logo image" })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiCreatedResponse({ type: OrganizationModel })
  @ApiBadRequestResponse({ type: ErrorResponseModel })
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  @ApiNotFoundResponse({ type: ErrorResponseModel })
  async uploadLogo(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<OrganizationView> {
    return toOrganizationView(await this.setOrganizationImage.execute(user.id, id, 'logo', file));
  }

  @Post(':id/banner')
  @RequirePermissions(PERMISSIONS.ORGANIZATION_UPDATE)
  @ApiImageUpload()
  @ApiOperation({ summary: "Upload the organization's banner image" })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiCreatedResponse({ type: OrganizationModel })
  @ApiBadRequestResponse({ type: ErrorResponseModel })
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  @ApiNotFoundResponse({ type: ErrorResponseModel })
  async uploadBanner(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<OrganizationView> {
    return toOrganizationView(await this.setOrganizationImage.execute(user.id, id, 'banner', file));
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.ORGANIZATION_DELETE)
  @ApiOperation({ summary: 'Soft-delete an organization' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse()
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  @ApiNotFoundResponse({ type: ErrorResponseModel })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: UserPublicProfile, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.deleteOrganization.execute(user.id, id);
  }

  @Post(':id/select')
  @ApiOperation({ summary: 'Select an active organization' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: OrganizationModel })
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  @ApiNotFoundResponse({ type: ErrorResponseModel })
  @HttpCode(HttpStatus.OK)
  async select(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<OrganizationView> {
    // Reusa Get (que exige membresía activa): solo se puede seleccionar una org propia.
    const organization = await this.getOrganization.execute(user.id, id);
    this.activeOrgCookie.set(res, organization.id);
    return toOrganizationView(organization);
  }
}
