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
  Put,
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
import { BranchModel, DisciplineModel, ErrorResponseModel } from '../../../common/openapi/api-models';
import { ACCESS_TOKEN_SECURITY, ACTIVE_GYM_SECURITY } from '../../../config/openapi.config';
import { CurrentUser } from '../../auth/interfaces/current-user.decorator';
import { JwtAuthGuard } from '../../auth/interfaces/jwt-auth.guard';
import type { DisciplineView } from '../../disciplines/interfaces/discipline.view';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import type { UserPublicProfile } from '../../users/application/user-public-profile';
import { CreateBranchUseCase } from '../application/create-branch.use-case';
import { GetBranchDisciplinesUseCase } from '../application/get-branch-disciplines.use-case';
import { GetBranchUseCase } from '../application/get-branch.use-case';
import { ListBranchesUseCase } from '../application/list-branches.use-case';
import { RemoveBranchUseCase } from '../application/remove-branch.use-case';
import { ReplaceBranchDisciplinesUseCase } from '../application/replace-branch-disciplines.use-case';
import { UpdateBranchUseCase } from '../application/update-branch.use-case';
import { BranchView } from './branch.view';
import { CreateBranchDto } from './dto/create-branch.dto';
import { ReplaceBranchDisciplinesDto } from './dto/replace-branch-disciplines.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Controller('gyms/:id/branches')
@UseGuards(JwtAuthGuard, ActiveGymGuard, PermissionGuard)
@UseFilters(DomainExceptionFilter)
@ApiTags('Branches')
@ApiCookieAuth(ACCESS_TOKEN_SECURITY)
@ApiCookieAuth(ACTIVE_GYM_SECURITY)
export class BranchesController {
  constructor(
    private readonly createBranch: CreateBranchUseCase,
    private readonly listBranches: ListBranchesUseCase,
    private readonly getBranch: GetBranchUseCase,
    private readonly updateBranch: UpdateBranchUseCase,
    private readonly removeBranch: RemoveBranchUseCase,
    private readonly getBranchDisciplines: GetBranchDisciplinesUseCase,
    private readonly replaceBranchDisciplines: ReplaceBranchDisciplinesUseCase,
  ) {}

  @Post()
  @RequirePermissions(PERMISSIONS.BRANCHES_MANAGE)
  @ApiOperation({ summary: 'Create a branch' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiCreatedResponse({ type: BranchModel })
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  async create(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) gymId: string,
    @Body() dto: CreateBranchDto,
  ): Promise<BranchView> {
    const branch = await this.createBranch.execute({ callerUserId: user.id, gymId, ...dto });
    return this.getBranch.execute(user.id, gymId, branch.id);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.BRANCHES_READ)
  @ApiOperation({ summary: 'List the branches of the gym' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: BranchModel, isArray: true })
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  list(@CurrentUser() user: UserPublicProfile, @Param('id', ParseUUIDPipe) gymId: string): Promise<BranchView[]> {
    return this.listBranches.execute(user.id, gymId);
  }

  @Get(':branchId')
  @RequirePermissions(PERMISSIONS.BRANCHES_READ)
  @ApiOperation({ summary: 'Get a branch by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'branchId', format: 'uuid' })
  @ApiOkResponse({ type: BranchModel })
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  @ApiNotFoundResponse({ type: ErrorResponseModel })
  getById(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) gymId: string,
    @Param('branchId', ParseUUIDPipe) branchId: string,
  ): Promise<BranchView> {
    return this.getBranch.execute(user.id, gymId, branchId);
  }

  @Patch(':branchId')
  @RequirePermissions(PERMISSIONS.BRANCHES_MANAGE)
  @ApiOperation({ summary: 'Update a branch' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'branchId', format: 'uuid' })
  @ApiOkResponse({ type: BranchModel })
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  @ApiNotFoundResponse({ type: ErrorResponseModel })
  update(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) gymId: string,
    @Param('branchId', ParseUUIDPipe) branchId: string,
    @Body() dto: UpdateBranchDto,
  ): Promise<BranchView> {
    return this.updateBranch.execute({ callerUserId: user.id, gymId, branchId, ...dto });
  }

  @Get(':branchId/disciplines')
  @RequirePermissions(PERMISSIONS.BRANCHES_READ)
  @ApiOperation({ summary: 'List the disciplines offered at a branch' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'branchId', format: 'uuid' })
  @ApiOkResponse({ type: DisciplineModel, isArray: true })
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  @ApiNotFoundResponse({ type: ErrorResponseModel })
  getDisciplines(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) gymId: string,
    @Param('branchId', ParseUUIDPipe) branchId: string,
  ): Promise<DisciplineView[]> {
    return this.getBranchDisciplines.execute(user.id, gymId, branchId);
  }

  @Put(':branchId/disciplines')
  @RequirePermissions(PERMISSIONS.BRANCHES_MANAGE)
  @ApiOperation({ summary: 'Replace the set of disciplines offered at a branch' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'branchId', format: 'uuid' })
  @ApiOkResponse({ type: DisciplineModel, isArray: true })
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  @ApiNotFoundResponse({ type: ErrorResponseModel })
  replaceDisciplines(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) gymId: string,
    @Param('branchId', ParseUUIDPipe) branchId: string,
    @Body() dto: ReplaceBranchDisciplinesDto,
  ): Promise<DisciplineView[]> {
    return this.replaceBranchDisciplines.execute(user.id, gymId, branchId, dto.disciplineIds);
  }

  @Delete(':branchId')
  @RequirePermissions(PERMISSIONS.BRANCHES_MANAGE)
  @ApiOperation({ summary: 'Soft-delete a branch' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'branchId', format: 'uuid' })
  @ApiNoContentResponse()
  @ApiForbiddenResponse({ type: ErrorResponseModel })
  @ApiNotFoundResponse({ type: ErrorResponseModel })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: UserPublicProfile,
    @Param('id', ParseUUIDPipe) gymId: string,
    @Param('branchId', ParseUUIDPipe) branchId: string,
  ): Promise<void> {
    await this.removeBranch.execute(user.id, gymId, branchId);
  }
}
