import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseFilters, UseGuards } from '@nestjs/common';
import {
  ApiConflictResponse,
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
import { ErrorResponseModel, SubscriptionModel } from '../../../common/openapi/api-models';
import { ACCESS_TOKEN_SECURITY, ACTIVE_GYM_SECURITY } from '../../../config/openapi.config';
import { CurrentUser } from '../../auth/interfaces/current-user.decorator';
import { JwtAuthGuard } from '../../auth/interfaces/jwt-auth.guard';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import type { UserPublicProfile } from '../../users/application/user-public-profile';
import { CreateSubscriptionUseCase } from '../application/create-subscription.use-case';
import { ListSubscriptionsUseCase } from '../application/list-subscriptions.use-case';
import { UpdateSubscriptionUseCase } from '../application/update-subscription.use-case';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { ListSubscriptionsQueryDto } from './dto/list-subscriptions-query.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { SubscriptionView } from './subscription.view';

@Controller('gyms/:id/subscriptions')
@UseGuards(JwtAuthGuard, ActiveGymGuard, PermissionGuard)
@UseFilters(DomainExceptionFilter)
@ApiTags('Subscriptions')
@ApiCookieAuth(ACCESS_TOKEN_SECURITY)
@ApiCookieAuth(ACTIVE_GYM_SECURITY)
export class SubscriptionsController {
  constructor(
    private readonly createSubscription: CreateSubscriptionUseCase,
    private readonly listSubscriptions: ListSubscriptionsUseCase,
    private readonly updateSubscription: UpdateSubscriptionUseCase,
  ) {}

  @Post()
  @RequirePermissions(PERMISSIONS.SUBSCRIPTIONS_MANAGE)
  @ApiOperation({ summary: 'Subscribe a member to a plan' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiCreatedResponse({ type: SubscriptionModel })
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  @ApiNotFoundResponse({ type: ErrorResponseModel })
  @ApiConflictResponse({ type: ErrorResponseModel })
  create(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) gymId: string,
    @Body() dto: CreateSubscriptionDto,
  ): Promise<SubscriptionView> {
    return this.createSubscription.execute({ callerUserId: user.id, gymId, ...dto });
  }

  @Get()
  @RequirePermissions(PERMISSIONS.SUBSCRIPTIONS_READ)
  @ApiOperation({ summary: 'List subscriptions, with optional filters' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: SubscriptionModel, isArray: true })
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  list(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) gymId: string,
    @Query() query: ListSubscriptionsQueryDto,
  ): Promise<SubscriptionView[]> {
    return this.listSubscriptions.execute(user.id, gymId, query);
  }

  @Patch(':subscriptionId')
  @RequirePermissions(PERMISSIONS.SUBSCRIPTIONS_MANAGE)
  @ApiOperation({ summary: 'Cancel a subscription and/or change renewalMode/endDate' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'subscriptionId', format: 'uuid' })
  @ApiOkResponse({ type: SubscriptionModel })
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  @ApiNotFoundResponse({ type: ErrorResponseModel })
  update(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) gymId: string,
    @Param('subscriptionId', ParseUUIDPipe) subscriptionId: string,
    @Body() dto: UpdateSubscriptionDto,
  ): Promise<SubscriptionView> {
    return this.updateSubscription.execute({ callerUserId: user.id, gymId, subscriptionId, ...dto });
  }
}
