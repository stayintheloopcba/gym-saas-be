import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
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
import { AuthContextService } from '../../../common/context/auth-context.service';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { DomainExceptionFilter } from '../../../common/errors/domain-exception.filter';
import { ActiveOrgGuard } from '../../../common/guards/active-org.guard';
import { PermissionGuard } from '../../../common/guards/permission.guard';
import { ErrorResponseModel, PaginatedResourceModel, ResourceModel } from '../../../common/openapi/api-models';
import { ACCESS_TOKEN_SECURITY, ACTIVE_ORG_SECURITY } from '../../../config/openapi.config';
import { CurrentUser } from '../../auth/interfaces/current-user.decorator';
import { JwtAuthGuard } from '../../auth/interfaces/jwt-auth.guard';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import type { UserPublicProfile } from '../../users/application/user-public-profile';
import { CreateResourceUseCase } from '../application/create-resource.use-case';
import { DeleteResourceUseCase } from '../application/delete-resource.use-case';
import { GetResourceUseCase } from '../application/get-resource.use-case';
import { ListResourcesUseCase } from '../application/list-resources.use-case';
import { UpdateResourceUseCase } from '../application/update-resource.use-case';
import { CreateResourceDto } from './dto/create-resource.dto';
import { ListResourcesQueryDto } from './dto/list-resources-query.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { PaginatedResourceView, ResourceView, toPaginatedResourceView, toResourceView } from './resource.view';

@Controller('resources')
@UseGuards(JwtAuthGuard, ActiveOrgGuard, PermissionGuard)
@UseFilters(DomainExceptionFilter)
@ApiTags('Resources')
@ApiCookieAuth(ACCESS_TOKEN_SECURITY)
@ApiCookieAuth(ACTIVE_ORG_SECURITY)
export class ResourcesController {
  constructor(
    private readonly authContext: AuthContextService,
    private readonly createResource: CreateResourceUseCase,
    private readonly listResources: ListResourcesUseCase,
    private readonly getResource: GetResourceUseCase,
    private readonly updateResource: UpdateResourceUseCase,
    private readonly deleteResource: DeleteResourceUseCase,
  ) {}

  @Post()
  @RequirePermissions(PERMISSIONS.RESOURCES_CREATE)
  @ApiOperation({ summary: 'Create a resource in the active organization' })
  @ApiCreatedResponse({ type: ResourceModel })
  @ApiBadRequestResponse({ type: ErrorResponseModel })
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  async create(@CurrentUser() user: UserPublicProfile, @Body() dto: CreateResourceDto): Promise<ResourceView> {
    const resource = await this.createResource.execute({
      callerUserId: user.id,
      organizationId: this.organizationId(),
      ...dto,
    });
    return toResourceView(resource);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.RESOURCES_READ)
  @ApiOperation({ summary: 'List resources from the active organization' })
  @ApiOkResponse({ type: PaginatedResourceModel })
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  async list(
    @CurrentUser() user: UserPublicProfile,
    @Query() query: ListResourcesQueryDto,
  ): Promise<PaginatedResourceView> {
    const result = await this.listResources.execute(user.id, this.organizationId(), query);
    return toPaginatedResourceView(result, query.page, query.limit);
  }

  @Get(':resourceId')
  @RequirePermissions({
    permission: PERMISSIONS.RESOURCES_READ,
    resource: 'resource',
    resourceId: (req) => req.params.resourceId as string,
  })
  @ApiOperation({ summary: 'Get one resource from the active organization' })
  @ApiParam({ name: 'resourceId', format: 'uuid' })
  @ApiOkResponse({ type: ResourceModel })
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  @ApiNotFoundResponse({ type: ErrorResponseModel })
  async getById(
    @CurrentUser() user: UserPublicProfile,
    @Param('resourceId', ParseUUIDPipe) resourceId: string,
  ): Promise<ResourceView> {
    return toResourceView(await this.getResource.execute(user.id, this.organizationId(), resourceId));
  }

  @Patch(':resourceId')
  @RequirePermissions({
    permission: PERMISSIONS.RESOURCES_UPDATE,
    resource: 'resource',
    resourceId: (req) => req.params.resourceId as string,
  })
  @ApiOperation({ summary: 'Update a resource from the active organization' })
  @ApiParam({ name: 'resourceId', format: 'uuid' })
  @ApiOkResponse({ type: ResourceModel })
  @ApiBadRequestResponse({ type: ErrorResponseModel })
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  @ApiNotFoundResponse({ type: ErrorResponseModel })
  async update(
    @CurrentUser() user: UserPublicProfile,
    @Param('resourceId', ParseUUIDPipe) resourceId: string,
    @Body() dto: UpdateResourceDto,
  ): Promise<ResourceView> {
    const resource = await this.updateResource.execute({
      callerUserId: user.id,
      organizationId: this.organizationId(),
      resourceId,
      ...dto,
    });
    return toResourceView(resource);
  }

  @Delete(':resourceId')
  @RequirePermissions({
    permission: PERMISSIONS.RESOURCES_DELETE,
    resource: 'resource',
    resourceId: (req) => req.params.resourceId as string,
  })
  @ApiOperation({ summary: 'Soft-delete a resource from the active organization' })
  @ApiParam({ name: 'resourceId', format: 'uuid' })
  @ApiNoContentResponse()
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  @ApiNotFoundResponse({ type: ErrorResponseModel })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: UserPublicProfile,
    @Param('resourceId', ParseUUIDPipe) resourceId: string,
  ): Promise<void> {
    await this.deleteResource.execute(user.id, this.organizationId(), resourceId);
  }

  private organizationId(): string {
    const organizationId = this.authContext.getActiveOrganizationId();
    if (!organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return organizationId;
  }
}
