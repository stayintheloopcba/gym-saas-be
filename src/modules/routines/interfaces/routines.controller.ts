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
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import {
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
import { ErrorResponseModel, RoutineModel } from '../../../common/openapi/api-models';
import { ACCESS_TOKEN_SECURITY, ACTIVE_GYM_SECURITY } from '../../../config/openapi.config';
import { CurrentUser } from '../../auth/interfaces/current-user.decorator';
import { JwtAuthGuard } from '../../auth/interfaces/jwt-auth.guard';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import type { UserPublicProfile } from '../../users/application/user-public-profile';
import { CreateRoutineUseCase } from '../application/create-routine.use-case';
import { GetRoutineUseCase } from '../application/get-routine.use-case';
import { ListRoutinesUseCase } from '../application/list-routines.use-case';
import { RemoveRoutineUseCase } from '../application/remove-routine.use-case';
import { UpdateRoutineUseCase } from '../application/update-routine.use-case';
import { CreateRoutineDto } from './dto/create-routine.dto';
import { UpdateRoutineDto } from './dto/update-routine.dto';
import { RoutineView } from './routine.view';

@Controller('gyms/:id/routines')
@UseGuards(JwtAuthGuard, ActiveGymGuard, PermissionGuard)
@UseFilters(DomainExceptionFilter)
@ApiTags('Routines')
@ApiCookieAuth(ACCESS_TOKEN_SECURITY)
@ApiCookieAuth(ACTIVE_GYM_SECURITY)
export class RoutinesController {
  constructor(
    private readonly createRoutine: CreateRoutineUseCase,
    private readonly listRoutines: ListRoutinesUseCase,
    private readonly getRoutine: GetRoutineUseCase,
    private readonly updateRoutine: UpdateRoutineUseCase,
    private readonly removeRoutine: RemoveRoutineUseCase,
  ) {}

  @Post()
  @RequirePermissions(PERMISSIONS.ROUTINES_MANAGE)
  @ApiOperation({ summary: 'Create a routine (template or personal)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiCreatedResponse({ type: RoutineModel })
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  create(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) gymId: string,
    @Body() dto: CreateRoutineDto,
  ): Promise<RoutineView> {
    return this.createRoutine.execute({ callerUserId: user.id, gymId, ...dto });
  }

  @Get()
  @RequirePermissions(PERMISSIONS.ROUTINES_READ)
  @ApiOperation({ summary: 'List the routines visible to the caller' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: RoutineModel, isArray: true })
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  list(@CurrentUser() user: UserPublicProfile, @Param('id', ParseUUIDPipe) gymId: string): Promise<RoutineView[]> {
    return this.listRoutines.execute(user.id, gymId);
  }

  @Get(':routineId')
  @RequirePermissions(PERMISSIONS.ROUTINES_READ)
  @ApiOperation({ summary: 'Get a routine by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'routineId', format: 'uuid' })
  @ApiOkResponse({ type: RoutineModel })
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  @ApiNotFoundResponse({ type: ErrorResponseModel })
  getById(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) gymId: string,
    @Param('routineId', ParseUUIDPipe) routineId: string,
  ): Promise<RoutineView> {
    return this.getRoutine.execute(user.id, gymId, routineId);
  }

  @Patch(':routineId')
  @RequirePermissions(PERMISSIONS.ROUTINES_MANAGE)
  @ApiOperation({ summary: 'Update a routine (name/notes/active/items)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'routineId', format: 'uuid' })
  @ApiOkResponse({ type: RoutineModel })
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  @ApiNotFoundResponse({ type: ErrorResponseModel })
  update(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) gymId: string,
    @Param('routineId', ParseUUIDPipe) routineId: string,
    @Body() dto: UpdateRoutineDto,
  ): Promise<RoutineView> {
    return this.updateRoutine.execute({ callerUserId: user.id, gymId, routineId, ...dto });
  }

  @Delete(':routineId')
  @RequirePermissions(PERMISSIONS.ROUTINES_MANAGE)
  @ApiOperation({ summary: 'Soft-delete a routine' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'routineId', format: 'uuid' })
  @ApiNoContentResponse()
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  @ApiNotFoundResponse({ type: ErrorResponseModel })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) gymId: string,
    @Param('routineId', ParseUUIDPipe) routineId: string,
  ): Promise<void> {
    await this.removeRoutine.execute(user.id, gymId, routineId);
  }
}
