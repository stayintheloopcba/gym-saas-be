import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiGoneResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { DomainExceptionFilter } from '../../../common/errors/domain-exception.filter';
import { ActiveOrgGuard } from '../../../common/guards/active-org.guard';
import { PermissionGuard } from '../../../common/guards/permission.guard';
import {
  AcceptedInvitationModel,
  ErrorResponseModel,
  InvitationModel,
  SuccessResponseModel,
} from '../../../common/openapi/api-models';
import { ACCESS_TOKEN_SECURITY, ACTIVE_ORG_SECURITY } from '../../../config/openapi.config';
import { CurrentUser } from '../../auth/interfaces/current-user.decorator';
import { JwtAuthGuard } from '../../auth/interfaces/jwt-auth.guard';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import type { UserPublicProfile } from '../../users/application/user-public-profile';
import { AcceptInvitationUseCase } from '../application/accept-invitation.use-case';
import { CreateInvitationUseCase } from '../application/create-invitation.use-case';
import { DeclineInvitationUseCase } from '../application/decline-invitation.use-case';
import { ListMyInvitationsUseCase, ListPendingInvitationsUseCase } from '../application/list-invitations.use-cases';
import { RevokeInvitationUseCase } from '../application/revoke-invitation.use-case';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { DeclineInvitationDto } from './dto/decline-invitation.dto';
import { InvitationView, toInvitationView } from './invitation.view';

/**
 * Endpoints de invitaciones.
 *
 * - Las rutas org-scoped (`organizations/:id/invitations`) son de negocio: JWT +
 *   `ActiveOrgGuard` (el `:id` debe igualar la organización activa).
 * - Aceptar / rechazar / revocar / "mías" son rutas de cuenta: solo JWT, porque
 *   el invitado aún no es miembro (no tiene esa org como activa).
 */
@Controller()
@UseGuards(JwtAuthGuard, PermissionGuard)
@UseFilters(DomainExceptionFilter)
@ApiTags('Invitations')
@ApiCookieAuth(ACCESS_TOKEN_SECURITY)
export class InvitationsController {
  constructor(
    private readonly createInvitation: CreateInvitationUseCase,
    private readonly listPending: ListPendingInvitationsUseCase,
    private readonly listMine: ListMyInvitationsUseCase,
    private readonly revokeInvitation: RevokeInvitationUseCase,
    private readonly acceptInvitation: AcceptInvitationUseCase,
    private readonly declineInvitation: DeclineInvitationUseCase,
  ) {}

  @Post('organizations/:id/invitations')
  @RequirePermissions(PERMISSIONS.MEMBERS_INVITE)
  @ApiOperation({ summary: 'Invite a user to the selected organization' })
  @ApiCookieAuth(ACTIVE_ORG_SECURITY)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiCreatedResponse({ type: InvitationModel })
  @ApiBadRequestResponse({ type: ErrorResponseModel })
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  @ApiConflictResponse({ type: ErrorResponseModel })
  @UseGuards(ActiveOrgGuard)
  async create(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) organizationId: string,
    @Body() dto: CreateInvitationDto,
  ): Promise<InvitationView> {
    const invitation = await this.createInvitation.execute({
      callerUserId: user.id,
      organizationId,
      email: dto.email,
      role: dto.role,
    });
    return toInvitationView(invitation);
  }

  @Get('organizations/:id/invitations')
  @RequirePermissions(PERMISSIONS.MEMBERS_READ)
  @ApiOperation({ summary: 'List pending invitations for the selected organization' })
  @ApiCookieAuth(ACTIVE_ORG_SECURITY)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: InvitationModel, isArray: true })
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  @UseGuards(ActiveOrgGuard)
  async listForOrg(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) organizationId: string,
  ): Promise<InvitationView[]> {
    const invitations = await this.listPending.execute(user.id, organizationId);
    return invitations.map(toInvitationView);
  }

  @Get('invitations/mine')
  @ApiOperation({ summary: 'List pending invitations for the authenticated email' })
  @ApiOkResponse({ type: InvitationModel, isArray: true })
  async mine(@CurrentUser() user: UserPublicProfile): Promise<InvitationView[]> {
    const invitations = await this.listMine.execute(user.email);
    return invitations.map(toInvitationView);
  }

  @Delete('invitations/:id')
  @ApiOperation({ summary: 'Revoke a pending invitation' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse()
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  @ApiNotFoundResponse({ type: ErrorResponseModel })
  @HttpCode(HttpStatus.NO_CONTENT)
  async revoke(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) invitationId: string,
  ): Promise<void> {
    await this.revokeInvitation.execute(user.id, invitationId);
  }

  @Post('invitations/accept')
  @ApiOperation({ summary: 'Accept an invitation for the authenticated email' })
  @ApiOkResponse({ type: AcceptedInvitationModel })
  @ApiBadRequestResponse({ type: ErrorResponseModel })
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  @ApiConflictResponse({ type: ErrorResponseModel })
  @ApiGoneResponse({ type: ErrorResponseModel })
  @HttpCode(HttpStatus.OK)
  async accept(
    @CurrentUser() user: UserPublicProfile,
    @Body() dto: AcceptInvitationDto,
  ): Promise<{ success: true; organizationId: string }> {
    const membership = await this.acceptInvitation.execute({
      callerUserId: user.id,
      callerEmail: user.email,
      token: dto.token,
    });
    return { success: true, organizationId: membership.organizationId };
  }

  @Post('invitations/decline')
  @ApiOperation({ summary: 'Decline an invitation for the authenticated email' })
  @ApiOkResponse({ type: SuccessResponseModel })
  @ApiBadRequestResponse({ type: ErrorResponseModel })
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  @ApiGoneResponse({ type: ErrorResponseModel })
  @HttpCode(HttpStatus.OK)
  async decline(@CurrentUser() user: UserPublicProfile, @Body() dto: DeclineInvitationDto): Promise<{ success: true }> {
    await this.declineInvitation.execute({ callerEmail: user.email, token: dto.token });
    return { success: true };
  }
}
