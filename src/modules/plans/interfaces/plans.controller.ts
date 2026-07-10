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
import { ErrorResponseModel, PlanModel } from '../../../common/openapi/api-models';
import { ACCESS_TOKEN_SECURITY, ACTIVE_GYM_SECURITY } from '../../../config/openapi.config';
import { CurrentUser } from '../../auth/interfaces/current-user.decorator';
import { JwtAuthGuard } from '../../auth/interfaces/jwt-auth.guard';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import type { UserPublicProfile } from '../../users/application/user-public-profile';
import { CreatePlanUseCase } from '../application/create-plan.use-case';
import { GetPlanUseCase } from '../application/get-plan.use-case';
import { ListPlansUseCase } from '../application/list-plans.use-case';
import { RemovePlanUseCase } from '../application/remove-plan.use-case';
import { UpdatePlanUseCase } from '../application/update-plan.use-case';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { PlanView } from './plan.view';

@Controller('gyms/:id/plans')
@UseGuards(JwtAuthGuard, ActiveGymGuard, PermissionGuard)
@UseFilters(DomainExceptionFilter)
@ApiTags('Plans')
@ApiCookieAuth(ACCESS_TOKEN_SECURITY)
@ApiCookieAuth(ACTIVE_GYM_SECURITY)
export class PlansController {
  constructor(
    private readonly createPlan: CreatePlanUseCase,
    private readonly listPlans: ListPlansUseCase,
    private readonly getPlan: GetPlanUseCase,
    private readonly updatePlan: UpdatePlanUseCase,
    private readonly removePlan: RemovePlanUseCase,
  ) {}

  @Post()
  @RequirePermissions(PERMISSIONS.PLANS_MANAGE)
  @ApiOperation({ summary: 'Create a plan (>=1 branch; disciplines must be offered at those branches)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiCreatedResponse({ type: PlanModel })
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  @ApiConflictResponse({ type: ErrorResponseModel })
  create(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) gymId: string,
    @Body() dto: CreatePlanDto,
  ): Promise<PlanView> {
    return this.createPlan.execute({ callerUserId: user.id, gymId, ...dto });
  }

  @Get()
  @RequirePermissions(PERMISSIONS.PLANS_READ)
  @ApiOperation({ summary: 'List the plans of the gym' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: PlanModel, isArray: true })
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  list(@CurrentUser() user: UserPublicProfile, @Param('id', ParseUUIDPipe) gymId: string): Promise<PlanView[]> {
    return this.listPlans.execute(user.id, gymId);
  }

  @Get(':planId')
  @RequirePermissions(PERMISSIONS.PLANS_READ)
  @ApiOperation({ summary: 'Get a plan by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'planId', format: 'uuid' })
  @ApiOkResponse({ type: PlanModel })
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  @ApiNotFoundResponse({ type: ErrorResponseModel })
  getById(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) gymId: string,
    @Param('planId', ParseUUIDPipe) planId: string,
  ): Promise<PlanView> {
    return this.getPlan.execute(user.id, gymId, planId);
  }

  @Patch(':planId')
  @RequirePermissions(PERMISSIONS.PLANS_MANAGE)
  @ApiOperation({ summary: 'Update a plan' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'planId', format: 'uuid' })
  @ApiOkResponse({ type: PlanModel })
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  @ApiNotFoundResponse({ type: ErrorResponseModel })
  @ApiConflictResponse({ type: ErrorResponseModel })
  update(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) gymId: string,
    @Param('planId', ParseUUIDPipe) planId: string,
    @Body() dto: UpdatePlanDto,
  ): Promise<PlanView> {
    return this.updatePlan.execute({ callerUserId: user.id, gymId, planId, ...dto });
  }

  @Delete(':planId')
  @RequirePermissions(PERMISSIONS.PLANS_MANAGE)
  @ApiOperation({ summary: 'Soft-delete a plan' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'planId', format: 'uuid' })
  @ApiNoContentResponse()
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  @ApiNotFoundResponse({ type: ErrorResponseModel })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) gymId: string,
    @Param('planId', ParseUUIDPipe) planId: string,
  ): Promise<void> {
    await this.removePlan.execute(user.id, gymId, planId);
  }
}
