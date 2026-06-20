import { Body, Controller, Patch, Post, UploadedFile, UseFilters, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { DomainExceptionFilter } from '../../../common/errors/domain-exception.filter';
import { ApiImageUpload } from '../../../common/openapi/api-image-upload.decorator';
import { ErrorResponseModel, UserPublicProfileModel } from '../../../common/openapi/api-models';
import { ACCESS_TOKEN_SECURITY } from '../../../config/openapi.config';
import { CurrentUser } from '../../auth/interfaces/current-user.decorator';
import { JwtAuthGuard } from '../../auth/interfaces/jwt-auth.guard';
import { SetUserAvatarUseCase } from '../application/set-user-avatar.use-case';
import { toPublicProfile, type UserPublicProfile } from '../application/user-public-profile';
import { UpdateUserProfileUseCase } from '../application/update-user-profile.use-case';
import { UpdateProfileDto } from './dto/update-profile.dto';

/** Endpoints del perfil propio del usuario autenticado. */
@Controller('users')
@UseGuards(JwtAuthGuard)
@UseFilters(DomainExceptionFilter)
@ApiTags('Users')
@ApiCookieAuth(ACCESS_TOKEN_SECURITY)
export class UsersController {
  constructor(
    private readonly updateProfile: UpdateUserProfileUseCase,
    private readonly setAvatar: SetUserAvatarUseCase,
  ) {}

  @Patch('me')
  @ApiOperation({ summary: 'Update the authenticated user profile' })
  @ApiOkResponse({ type: UserPublicProfileModel })
  @ApiBadRequestResponse({ type: ErrorResponseModel })
  @ApiUnauthorizedResponse({ type: ErrorResponseModel })
  async updateMe(@CurrentUser() user: UserPublicProfile, @Body() dto: UpdateProfileDto): Promise<UserPublicProfile> {
    return toPublicProfile(await this.updateProfile.execute(user.id, dto));
  }

  @Post('me/avatar')
  @ApiImageUpload()
  @ApiOperation({ summary: 'Upload the authenticated user avatar' })
  @ApiCreatedResponse({ type: UserPublicProfileModel })
  @ApiBadRequestResponse({ type: ErrorResponseModel })
  @ApiUnauthorizedResponse({ type: ErrorResponseModel })
  async uploadAvatar(
    @CurrentUser() user: UserPublicProfile,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UserPublicProfile> {
    return toPublicProfile(await this.setAvatar.execute(user.id, file));
  }
}
