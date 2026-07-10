import { Body, Controller, Get, Param, ParseUUIDPipe, Put, UseFilters, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiForbiddenResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { DomainExceptionFilter } from '../../../common/errors/domain-exception.filter';
import { ActiveGymGuard } from '../../../common/guards/active-gym.guard';
import { PermissionGuard } from '../../../common/guards/permission.guard';
import { ErrorResponseModel, GymSettingsModel } from '../../../common/openapi/api-models';
import { ACCESS_TOKEN_SECURITY, ACTIVE_GYM_SECURITY } from '../../../config/openapi.config';
import { CurrentUser } from '../../auth/interfaces/current-user.decorator';
import { JwtAuthGuard } from '../../auth/interfaces/jwt-auth.guard';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import type { UserPublicProfile } from '../../users/application/user-public-profile';
import { GetGymSettingsUseCase } from '../application/get-gym-settings.use-case';
import { UpdateGymSettingsUseCase } from '../application/update-gym-settings.use-case';
import { UpdateGymSettingsDto } from './dto/update-gym-settings.dto';
import { GymSettingsView } from './gym-settings.view';

@Controller('gyms/:id/settings')
@UseGuards(JwtAuthGuard, ActiveGymGuard, PermissionGuard)
@UseFilters(DomainExceptionFilter)
@ApiTags('Gym settings')
@ApiCookieAuth(ACCESS_TOKEN_SECURITY)
@ApiCookieAuth(ACTIVE_GYM_SECURITY)
export class GymSettingsController {
  constructor(
    private readonly getGymSettings: GetGymSettingsUseCase,
    private readonly updateGymSettings: UpdateGymSettingsUseCase,
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS.SETTINGS_READ)
  @ApiOperation({ summary: 'Get the gym settings (factory defaults if never configured)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: GymSettingsModel })
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  get(@CurrentUser() user: UserPublicProfile, @Param('id', ParseUUIDPipe) gymId: string): Promise<GymSettingsView> {
    return this.getGymSettings.execute(user.id, gymId);
  }

  @Put()
  @RequirePermissions(PERMISSIONS.SETTINGS_UPDATE)
  @ApiOperation({ summary: 'Replace the gym settings' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: GymSettingsModel })
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  update(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) gymId: string,
    @Body() dto: UpdateGymSettingsDto,
  ): Promise<GymSettingsView> {
    return this.updateGymSettings.execute({ callerUserId: user.id, gymId, ...dto });
  }
}
