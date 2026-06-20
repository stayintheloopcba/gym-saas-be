import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ErrorResponseModel, OnboardingStatusModel } from '../../../common/openapi/api-models';
import { ACCESS_TOKEN_SECURITY } from '../../../config/openapi.config';
import { CurrentUser } from '../../auth/interfaces/current-user.decorator';
import { JwtAuthGuard } from '../../auth/interfaces/jwt-auth.guard';
import { InvitationView, toInvitationView } from '../../invitations/interfaces/invitation.view';
import type { UserPublicProfile } from '../../users/application/user-public-profile';
import { GetOnboardingStatusUseCase } from '../application/get-onboarding-status.use-case';

interface OnboardingStatusResponse {
  needsOnboarding: boolean;
  organizationsCount: number;
  hasActiveOrganization: boolean;
  activeOrganizationId: string | null;
  pendingInvitations: InvitationView[];
}

/**
 * Endpoint que el frontend consulta para decidir el ruteo onboarding-vs-dashboard.
 * Solo requiere JWT (es previo a tener cualquier organización activa).
 */
@Controller('onboarding')
@UseGuards(JwtAuthGuard)
@ApiTags('Onboarding')
@ApiCookieAuth(ACCESS_TOKEN_SECURITY)
export class OnboardingController {
  constructor(private readonly getOnboardingStatus: GetOnboardingStatusUseCase) {}

  @Get('status')
  @ApiOperation({ summary: 'Get the onboarding and active-organization status' })
  @ApiOkResponse({ type: OnboardingStatusModel })
  @ApiUnauthorizedResponse({ type: ErrorResponseModel })
  async status(@CurrentUser() user: UserPublicProfile): Promise<OnboardingStatusResponse> {
    const result = await this.getOnboardingStatus.execute(user.id, user.email);
    return { ...result, pendingInvitations: result.pendingInvitations.map(toInvitationView) };
  }
}
