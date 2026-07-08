import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ErrorResponseModel, OnboardingStatusModel } from '../../../common/openapi/api-models';
import { ACCESS_TOKEN_SECURITY } from '../../../config/openapi.config';
import { CurrentUser } from '../../auth/interfaces/current-user.decorator';
import { JwtAuthGuard } from '../../auth/interfaces/jwt-auth.guard';
import { Invitation } from '../../invitations/domain/invitation.entity';
import { InvitationView, toInvitationView } from '../../invitations/interfaces/invitation.view';
import { PERMISSION_REPOSITORY } from '../../permissions/domain/permission.repository';
import type { PermissionRepository } from '../../permissions/domain/permission.repository';
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
  constructor(
    private readonly getOnboardingStatus: GetOnboardingStatusUseCase,
    @Inject(PERMISSION_REPOSITORY) private readonly permissionsRepo: PermissionRepository,
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'Get the onboarding and active-organization status' })
  @ApiOkResponse({ type: OnboardingStatusModel })
  @ApiUnauthorizedResponse({ type: ErrorResponseModel })
  async status(@CurrentUser() user: UserPublicProfile): Promise<OnboardingStatusResponse> {
    const result = await this.getOnboardingStatus.execute(user.id, user.email);
    const pendingInvitations = await Promise.all(
      result.pendingInvitations.map((invitation) => this.toView(invitation)),
    );
    return { ...result, pendingInvitations };
  }

  private async toView(invitation: Invitation): Promise<InvitationView> {
    const role = await this.permissionsRepo.findRoleSummary(invitation.roleId);
    if (!role) {
      throw new Error(`Invitation ${invitation.id} references an unknown role`);
    }
    return toInvitationView(invitation, role);
  }
}
