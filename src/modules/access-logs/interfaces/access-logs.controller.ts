import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
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
import { AccessLogModel, ErrorResponseModel } from '../../../common/openapi/api-models';
import { ACCESS_TOKEN_SECURITY, ACTIVE_GYM_SECURITY } from '../../../config/openapi.config';
import { CurrentUser } from '../../auth/interfaces/current-user.decorator';
import { JwtAuthGuard } from '../../auth/interfaces/jwt-auth.guard';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import type { UserPublicProfile } from '../../users/application/user-public-profile';
import { CheckInUseCase } from '../application/check-in.use-case';
import { ListAccessLogsUseCase } from '../application/list-access-logs.use-case';
import { AccessLogView } from './access-log.view';
import { CheckInDto } from './dto/check-in.dto';
import { ListAccessLogsQueryDto } from './dto/list-access-logs-query.dto';

@Controller('gyms/:id/access-logs')
@UseGuards(JwtAuthGuard, ActiveGymGuard, PermissionGuard)
@UseFilters(DomainExceptionFilter)
@ApiTags('Access logs')
@ApiCookieAuth(ACCESS_TOKEN_SECURITY)
@ApiCookieAuth(ACTIVE_GYM_SECURITY)
export class AccessLogsController {
  constructor(
    private readonly checkIn: CheckInUseCase,
    private readonly listAccessLogs: ListAccessLogsUseCase,
  ) {}

  @Post('check-in')
  @RequirePermissions(PERMISSIONS.ACCESS_CHECKIN)
  @ApiOperation({ summary: 'Manual check-in. Always 201 — DENIED is data, not an error.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiCreatedResponse({ type: AccessLogModel })
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  @ApiNotFoundResponse({ type: ErrorResponseModel })
  @HttpCode(HttpStatus.CREATED)
  checkInMember(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) gymId: string,
    @Body() dto: CheckInDto,
  ): Promise<AccessLogView> {
    return this.checkIn.execute({ callerUserId: user.id, gymId, ...dto });
  }

  @Get()
  @RequirePermissions(PERMISSIONS.ACCESS_READ)
  @ApiOperation({ summary: 'List access logs, with optional filters' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: AccessLogModel, isArray: true })
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  list(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) gymId: string,
    @Query() query: ListAccessLogsQueryDto,
  ): Promise<AccessLogView[]> {
    return this.listAccessLogs.execute(user.id, gymId, query);
  }
}
