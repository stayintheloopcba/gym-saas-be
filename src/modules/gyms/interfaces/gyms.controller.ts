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
  GymModel,
  GymWithRoleModel,
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
import { CreateGymUseCase } from '../application/create-gym.use-case';
import { DeleteGymUseCase } from '../application/delete-gym.use-case';
import { GetGymUseCase } from '../application/get-gym.use-case';
import { ListMyGymsUseCase } from '../application/list-my-gyms.use-case';
import { SetGymImageUseCase } from '../application/set-gym-image.use-case';
import { UpdateGymUseCase } from '../application/update-gym.use-case';
import { ActiveGymCookie } from './active-gym-cookie';
import { CreateGymDto } from './dto/create-gym.dto';
import { UpdateGymDto } from './dto/update-gym.dto';
import { GymView, GymWithRoleView, toGymView } from './gym.view';

/**
 * Endpoints de organizaciones y selección de organización activa.
 *
 * Todas las rutas exigen JWT (no `ActiveGymGuard`): son rutas de cuenta/onboarding
 * — un usuario sin organización todavía necesita poder crear o listar las suyas.
 * La validación del par (usuario, org) la hacen el guard y los casos de uso
 * mediante permisos granulares.
 */
@Controller('gyms')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UseFilters(DomainExceptionFilter)
@ApiTags('Gyms')
@ApiCookieAuth(ACCESS_TOKEN_SECURITY)
export class GymsController {
  constructor(
    private readonly createGym: CreateGymUseCase,
    private readonly listMyGyms: ListMyGymsUseCase,
    private readonly getGym: GetGymUseCase,
    private readonly updateGym: UpdateGymUseCase,
    private readonly setGymImage: SetGymImageUseCase,
    private readonly deleteGym: DeleteGymUseCase,
    private readonly activeGymCookie: ActiveGymCookie,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a gym and its owner membership' })
  @ApiCreatedResponse({ type: GymModel })
  @ApiBadRequestResponse({ type: ErrorResponseModel })
  async create(
    @CurrentUser() user: UserPublicProfile,
    @Body() dto: CreateGymDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<GymView> {
    const gym = await this.createGym.execute({ ownerUserId: user.id, name: dto.name });
    // El creador queda como OWNER y la organización pasa a ser la activa.
    this.activeGymCookie.set(res, gym.id);
    return toGymView(gym);
  }

  @Get()
  @ApiOperation({ summary: 'List gyms for the authenticated user' })
  @ApiOkResponse({ type: GymWithRoleModel, isArray: true })
  async listMine(@CurrentUser() user: UserPublicProfile): Promise<GymWithRoleView[]> {
    const mine = await this.listMyGyms.execute(user.id);
    return mine.map(({ gym, role }) => ({ ...toGymView(gym), role }));
  }

  @Post('select/clear')
  @ApiOperation({ summary: 'Clear the active gym cookie' })
  @ApiOkResponse({ type: SuccessResponseModel })
  @HttpCode(HttpStatus.OK)
  clearActive(@Res({ passthrough: true }) res: Response): { success: true } {
    this.activeGymCookie.clear(res);
    return { success: true };
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.GYM_READ)
  @ApiOperation({ summary: 'Get a gym where the user is an active member' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: GymModel })
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  @ApiNotFoundResponse({ type: ErrorResponseModel })
  async getById(@CurrentUser() user: UserPublicProfile, @Param('id', ParseUUIDPipe) id: string): Promise<GymView> {
    return toGymView(await this.getGym.execute(user.id, id));
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.GYM_UPDATE)
  @ApiOperation({ summary: 'Update a gym name and/or branding' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: GymModel })
  @ApiBadRequestResponse({ type: ErrorResponseModel })
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  @ApiNotFoundResponse({ type: ErrorResponseModel })
  async update(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGymDto,
  ): Promise<GymView> {
    return toGymView(await this.updateGym.execute(user.id, id, dto));
  }

  @Post(':id/logo')
  @RequirePermissions(PERMISSIONS.GYM_UPDATE)
  @ApiImageUpload()
  @ApiOperation({ summary: "Upload the gym's logo image" })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiCreatedResponse({ type: GymModel })
  @ApiBadRequestResponse({ type: ErrorResponseModel })
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  @ApiNotFoundResponse({ type: ErrorResponseModel })
  async uploadLogo(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<GymView> {
    return toGymView(await this.setGymImage.execute(user.id, id, 'logo', file));
  }

  @Post(':id/banner')
  @RequirePermissions(PERMISSIONS.GYM_UPDATE)
  @ApiImageUpload()
  @ApiOperation({ summary: "Upload the gym's banner image" })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiCreatedResponse({ type: GymModel })
  @ApiBadRequestResponse({ type: ErrorResponseModel })
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  @ApiNotFoundResponse({ type: ErrorResponseModel })
  async uploadBanner(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<GymView> {
    return toGymView(await this.setGymImage.execute(user.id, id, 'banner', file));
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.GYM_DELETE)
  @ApiOperation({ summary: 'Soft-delete a gym' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse()
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  @ApiNotFoundResponse({ type: ErrorResponseModel })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: UserPublicProfile, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.deleteGym.execute(user.id, id);
  }

  @Post(':id/select')
  @ApiOperation({ summary: 'Select an active gym' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: GymModel })
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  @ApiNotFoundResponse({ type: ErrorResponseModel })
  @HttpCode(HttpStatus.OK)
  async select(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<GymView> {
    // Reusa Get (que exige membresía activa): solo se puede seleccionar una org propia.
    const gym = await this.getGym.execute(user.id, id);
    this.activeGymCookie.set(res, gym.id);
    return toGymView(gym);
  }
}
