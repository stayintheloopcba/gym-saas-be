import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { ErrorResponseModel, RevokedSessionsModel, SessionModel } from '../../../common/openapi/api-models';
import { ACCESS_TOKEN_SECURITY } from '../../../config/openapi.config';
import { SessionService, SessionView } from '../../sessions/application/session.service';
import type { UserPublicProfile } from '../../users/application/user-public-profile';
import { AuthCookies } from './auth-cookies';
import { CurrentSessionId, CurrentUser } from './current-user.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('me/sessions')
@UseGuards(JwtAuthGuard)
@ApiTags('Sessions')
@ApiCookieAuth(ACCESS_TOKEN_SECURITY)
export class SessionsController {
  constructor(
    private readonly sessions: SessionService,
    private readonly cookies: AuthCookies,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List active sessions for the authenticated user' })
  @ApiOkResponse({ type: SessionModel, isArray: true })
  list(@CurrentUser() user: UserPublicProfile, @CurrentSessionId() currentSessionId: string): Promise<SessionView[]> {
    return this.sessions.list(user.id, currentSessionId);
  }

  @Delete()
  @ApiOperation({ summary: 'Revoke every session except the current one' })
  @ApiOkResponse({ type: RevokedSessionsModel })
  @HttpCode(HttpStatus.OK)
  async revokeOthers(
    @CurrentUser() user: UserPublicProfile,
    @CurrentSessionId() currentSessionId: string,
  ): Promise<{ success: true; revokedCount: number }> {
    const revokedCount = await this.sessions.revokeOthers(user.id, currentSessionId);
    return { success: true, revokedCount };
  }

  @Delete(':sessionId')
  @ApiOperation({ summary: 'Revoke one session owned by the authenticated user' })
  @ApiParam({ name: 'sessionId', format: 'uuid' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ type: ErrorResponseModel })
  @HttpCode(HttpStatus.NO_CONTENT)
  async revoke(
    @CurrentUser() user: UserPublicProfile,
    @CurrentSessionId() currentSessionId: string,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    if (!(await this.sessions.revoke(user.id, sessionId))) {
      throw new NotFoundException('Session not found');
    }
    if (sessionId === currentSessionId) {
      this.cookies.clearSessionCookies(response);
    }
  }
}
