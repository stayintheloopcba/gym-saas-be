import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { ErrorResponseModel, SuccessResponseModel, UserPublicProfileModel } from '../../../common/openapi/api-models';
import { ACCESS_TOKEN_SECURITY, REFRESH_TOKEN_SECURITY } from '../../../config/openapi.config';
import type { UserPublicProfile } from '../../users/application/user-public-profile';
import { AuthResult } from '../application/auth-result';
import { ActiveOrgCookie } from '../../organizations/interfaces/active-org-cookie';
import { GoogleAuthUseCase, GoogleProfile } from '../application/google-auth.use-case';
import { LoginUseCase } from '../application/login.use-case';
import { LogoutUseCase } from '../application/logout.use-case';
import { RefreshTokenUseCase } from '../application/refresh-token.use-case';
import { RegisterUseCase } from '../application/register.use-case';
import { AuthCookies, REFRESH_TOKEN_COOKIE } from './auth-cookies';
import { CurrentUser } from './current-user.decorator';
import { GoogleAuthGuard } from './google-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { requestSessionMetadata } from './request-session-metadata';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

/**
 * Endpoints de autenticación. Los tokens se emiten siempre en cookies httpOnly;
 * el body nunca expone tokens (solo el perfil público del usuario).
 */
@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly refreshUseCase: RefreshTokenUseCase,
    private readonly googleAuthUseCase: GoogleAuthUseCase,
    private readonly cookies: AuthCookies,
    private readonly activeOrgCookie: ActiveOrgCookie,
    private readonly config: ConfigService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a local user and start a session' })
  @ApiCreatedResponse({ type: UserPublicProfileModel })
  @ApiBadRequestResponse({ type: ErrorResponseModel })
  @ApiResponse({ status: 409, description: 'Email already registered.', type: ErrorResponseModel })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded.', type: ErrorResponseModel })
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserPublicProfile> {
    return this.completeAuth(await this.registerUseCase.execute({ ...dto, session: requestSessionMetadata(req) }), res);
  }

  @Post('login')
  @ApiOperation({ summary: 'Authenticate with email and password' })
  @ApiOkResponse({ type: UserPublicProfileModel })
  @ApiBadRequestResponse({ type: ErrorResponseModel })
  @ApiUnauthorizedResponse({ type: ErrorResponseModel })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded.', type: ErrorResponseModel })
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserPublicProfile> {
    return this.completeAuth(await this.loginUseCase.execute({ ...dto, session: requestSessionMetadata(req) }), res);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh the access and refresh JWT cookies' })
  @ApiCookieAuth(REFRESH_TOKEN_SECURITY)
  @ApiOkResponse({ type: UserPublicProfileModel })
  @ApiUnauthorizedResponse({ type: ErrorResponseModel })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded.', type: ErrorResponseModel })
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 60_000, limit: 15 } })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<UserPublicProfile> {
    const token = (req.cookies as Record<string, string> | undefined)?.[REFRESH_TOKEN_COOKIE];
    if (!token) {
      throw new UnauthorizedException('Missing refresh token');
    }
    return this.completeAuth(await this.refreshUseCase.execute(token, requestSessionMetadata(req)), res);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Clear the current authentication cookies' })
  @ApiOkResponse({ type: SuccessResponseModel })
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<{ success: true }> {
    const refreshToken = (req.cookies as Record<string, string> | undefined)?.[REFRESH_TOKEN_COOKIE];
    await this.logoutUseCase.execute(refreshToken);
    this.cookies.clearSessionCookies(res);
    return { success: true };
  }

  @Get('me')
  @ApiOperation({ summary: 'Get the authenticated user profile' })
  @ApiCookieAuth(ACCESS_TOKEN_SECURITY)
  @ApiOkResponse({ type: UserPublicProfileModel })
  @ApiUnauthorizedResponse({ type: ErrorResponseModel })
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: UserPublicProfile): UserPublicProfile {
    return user;
  }

  @Get('google')
  @ApiOperation({ summary: 'Start Google OAuth authentication' })
  @ApiResponse({ status: 302, description: 'Redirects to Google consent.' })
  @UseGuards(GoogleAuthGuard)
  googleInitiate(): void {
    // El guard de Passport redirige a la pantalla de consentimiento de Google.
  }

  @Get('google/callback')
  @ApiOperation({ summary: 'Complete Google OAuth and redirect to the frontend' })
  @ApiResponse({ status: 302, description: 'Sets session cookies and redirects to the frontend.' })
  @ApiUnauthorizedResponse({ type: ErrorResponseModel })
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: Request, @Res() res: Response): Promise<void> {
    const result = await this.googleAuthUseCase.execute(req.user as GoogleProfile, requestSessionMetadata(req));
    this.cookies.setSessionCookies(res, result.tokens);
    res.redirect(this.config.get<string>('FRONTEND_URL', 'http://localhost:5173'));
  }

  /** Setea las cookies de sesión (y la de org activa, si la hay) y devuelve el perfil. */
  private completeAuth(result: AuthResult, res: Response): UserPublicProfile {
    this.cookies.setSessionCookies(res, result.tokens);
    if (result.activeOrganizationId) {
      this.activeOrgCookie.set(res, result.activeOrganizationId);
    }
    return result.user;
  }
}
