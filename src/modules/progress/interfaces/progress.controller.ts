import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseFilters, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
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
import { ErrorResponseModel, ProgressEntryModel } from '../../../common/openapi/api-models';
import { ACCESS_TOKEN_SECURITY, ACTIVE_GYM_SECURITY } from '../../../config/openapi.config';
import { CurrentUser } from '../../auth/interfaces/current-user.decorator';
import { JwtAuthGuard } from '../../auth/interfaces/jwt-auth.guard';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import type { UserPublicProfile } from '../../users/application/user-public-profile';
import { ListProgressUseCase } from '../application/list-progress.use-case';
import { RecordProgressUseCase } from '../application/record-progress.use-case';
import { ListProgressQueryDto } from './dto/list-progress-query.dto';
import { RecordProgressDto } from './dto/record-progress.dto';
import { ProgressEntryView } from './progress.view';

@Controller('gyms/:id/members/:memberId/progress')
@UseGuards(JwtAuthGuard, ActiveGymGuard, PermissionGuard)
@UseFilters(DomainExceptionFilter)
@ApiTags('Progress')
@ApiCookieAuth(ACCESS_TOKEN_SECURITY)
@ApiCookieAuth(ACTIVE_GYM_SECURITY)
export class ProgressController {
  constructor(
    private readonly recordProgress: RecordProgressUseCase,
    private readonly listProgress: ListProgressUseCase,
  ) {}

  @Post()
  @RequirePermissions(PERMISSIONS.PROGRESS_RECORD)
  @ApiOperation({ summary: 'Record a training progress entry for a member' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'memberId', format: 'uuid' })
  @ApiCreatedResponse({ type: ProgressEntryModel })
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  @ApiNotFoundResponse({ type: ErrorResponseModel })
  record(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) gymId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body() dto: RecordProgressDto,
  ): Promise<ProgressEntryView> {
    return this.recordProgress.execute({ callerUserId: user.id, gymId, memberId, ...dto });
  }

  @Get()
  @RequirePermissions(PERMISSIONS.PROGRESS_READ)
  @ApiOperation({ summary: "List a member's progress entries, with optional filters" })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'memberId', format: 'uuid' })
  @ApiOkResponse({ type: ProgressEntryModel, isArray: true })
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  @ApiNotFoundResponse({ type: ErrorResponseModel })
  list(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) gymId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Query() query: ListProgressQueryDto,
  ): Promise<ProgressEntryView[]> {
    return this.listProgress.execute(user.id, gymId, memberId, query);
  }
}
