import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { AuthProvider } from '../enums/auth-provider.enum';
import { InvitationStatus } from '../enums/invitation-status.enum';
import { MembershipRole } from '../enums/membership-role.enum';
import { ResourceStatus } from '../../modules/resources/domain/resource-status.enum';

export class ErrorResponseModel {
  @ApiProperty({ example: '0194f21c-8814-7f0f-aaba-f4faca4ad9f2' })
  requestId: string;

  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'Bad Request' })
  error: string;

  @ApiProperty({ oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }] })
  message: string | string[];

  @ApiProperty({ format: 'date-time' })
  timestamp: string;

  @ApiProperty({ example: '/auth/login' })
  path: string;
}

export class SuccessResponseModel {
  @ApiProperty({ example: true })
  success: true;
}

export class UserPublicProfileModel {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'email' })
  email: string;

  @ApiProperty({ example: 'Ada Lovelace' })
  name: string;

  @ApiProperty({ enum: AuthProvider })
  provider: AuthProvider;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, nullable: true, example: 'https://cdn.example.com/user/abc/avatar.png' })
  avatarUrl: string | null;
}

export class OrganizationModel {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Acme Inc.' })
  name: string;

  @ApiProperty({ example: 'acme-inc' })
  slug: string;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time', nullable: true, description: 'Cosmetic 7-day trial end.' })
  trialEndsAt: Date | null;

  @ApiProperty({ type: String, nullable: true, example: '#0F62FE' })
  primaryColor: string | null;

  @ApiProperty({ type: String, nullable: true, example: '#161616' })
  secondaryColor: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'Inter' })
  fontFamily: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'http://localhost:9000/generic-saas/org/abc/logo-x.png' })
  logoUrl: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'http://localhost:9000/generic-saas/org/abc/banner-x.png' })
  bannerUrl: string | null;
}

export class OrganizationWithRoleModel extends OrganizationModel {
  @ApiProperty({ enum: MembershipRole })
  role: MembershipRole;
}

export class InvitationModel {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  organizationId: string;

  @ApiProperty({ format: 'email' })
  email: string;

  @ApiProperty({ enum: MembershipRole })
  role: MembershipRole;

  @ApiProperty({ enum: InvitationStatus })
  status: InvitationStatus;

  @ApiProperty({ description: 'Opaque invitation token used by the MVP while no mailer is configured.' })
  token: string;

  @ApiProperty({ format: 'date-time' })
  expiresAt: Date;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;
}

export class OrganizationMemberModel {
  @ApiProperty({ format: 'uuid' })
  membershipId: string;

  @ApiProperty({ enum: MembershipRole })
  role: MembershipRole;

  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  customRoleId: string | null;

  @ApiProperty({ type: UserPublicProfileModel })
  user: UserPublicProfileModel;
}

export class MyPermissionsModel {
  @ApiProperty({ format: 'uuid' })
  organizationId: string;

  @ApiProperty({ enum: MembershipRole })
  role: MembershipRole;

  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  customRoleId: string | null;

  @ApiProperty({
    description: 'Data scope of the current user: SELF=1, ORGANIZATION=5, GLOBAL=10.',
    example: 5,
  })
  hierarchyLevel: number;

  @ApiProperty({
    type: String,
    isArray: true,
    description: 'Effective permission codes (resource:action) granted to the current user.',
    example: ['organization:read', 'members:read', 'resources:create'],
  })
  permissions: string[];
}

export class RoleViewModel {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Billing manager' })
  name: string;

  @ApiProperty({ type: String, nullable: true, example: 'Manages billing and invoices' })
  description: string | null;

  @ApiProperty({ description: 'System roles are read-only and cannot be edited or deleted.' })
  isSystem: boolean;

  @ApiProperty({ enum: MembershipRole, nullable: true, description: 'Set only for system roles.' })
  systemKey: MembershipRole | null;

  @ApiProperty({ description: 'Data scope of the role: SELF=1, ORGANIZATION=5, GLOBAL=10.', example: 5 })
  hierarchyLevel: number;

  @ApiProperty({ type: String, format: 'uuid', nullable: true, description: 'Null for system roles (global).' })
  organizationId: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;
}

export class PermissionInfoModel {
  @ApiProperty({ example: 'resources:update' })
  code: string;

  @ApiProperty({ example: 'Update resources' })
  name: string;

  @ApiProperty({ type: String, nullable: true, example: 'Allows editing existing resources' })
  description: string | null;
}

export class PermissionAssignmentViewModel {
  @ApiProperty({ example: 'resources:update' })
  permissionCode: string;

  @ApiProperty({ description: 'true = allow, false = explicit deny.' })
  value: boolean;
}

@ApiExtraModels(PermissionAssignmentViewModel)
export class PermissionMatrixModel {
  @ApiProperty({ type: RoleViewModel, isArray: true })
  roles: RoleViewModel[];

  @ApiProperty({ type: PermissionInfoModel, isArray: true })
  permissions: PermissionInfoModel[];

  @ApiProperty({
    type: 'object',
    description: 'Per role id (key): the list of its permission assignments.',
    additionalProperties: {
      type: 'array',
      items: { $ref: getSchemaPath(PermissionAssignmentViewModel) },
    },
  })
  assignments: Record<string, PermissionAssignmentViewModel[]>;
}

export class OnboardingStatusModel {
  @ApiProperty()
  needsOnboarding: boolean;

  @ApiProperty({ minimum: 0 })
  organizationsCount: number;

  @ApiProperty()
  hasActiveOrganization: boolean;

  @ApiProperty({ format: 'uuid', nullable: true })
  activeOrganizationId: string | null;

  @ApiProperty({ type: InvitationModel, isArray: true })
  pendingInvitations: InvitationModel[];
}

export class AcceptedInvitationModel extends SuccessResponseModel {
  @ApiProperty({ format: 'uuid' })
  organizationId: string;
}

export class SessionModel {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ nullable: true, example: 'Mozilla/5.0' })
  userAgent: string | null;

  @ApiProperty({ nullable: true, example: '127.0.0.1' })
  ipAddress: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ format: 'date-time', nullable: true })
  lastUsedAt: Date | null;

  @ApiProperty({ format: 'date-time' })
  expiresAt: Date;

  @ApiProperty()
  current: boolean;
}

export class ResourceModel {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  organizationId: string;

  @ApiProperty({ example: 'Example resource' })
  name: string;

  @ApiProperty({ nullable: true, example: 'Optional description' })
  description: string | null;

  @ApiProperty({ enum: ResourceStatus })
  status: ResourceStatus;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ format: 'date-time', nullable: true })
  updatedAt: Date | null;
}

export class PaginationMetaModel {
  @ApiProperty({ minimum: 1 })
  page: number;

  @ApiProperty({ minimum: 1, maximum: 100 })
  limit: number;

  @ApiProperty({ minimum: 0 })
  total: number;

  @ApiProperty({ minimum: 0 })
  totalPages: number;
}

export class PaginatedResourceModel {
  @ApiProperty({ type: ResourceModel, isArray: true })
  data: ResourceModel[];

  @ApiProperty({ type: PaginationMetaModel })
  meta: PaginationMetaModel;
}

export class RevokedSessionsModel extends SuccessResponseModel {
  @ApiProperty({ minimum: 0 })
  revokedCount: number;
}

export class HealthStatusModel {
  @ApiProperty({ enum: ['ok', 'error'] })
  status: 'ok' | 'error';

  @ApiProperty({ example: 'development' })
  environment: string;

  @ApiProperty({ description: 'Process uptime in seconds.', minimum: 0 })
  uptime: number;

  @ApiProperty({ format: 'date-time' })
  timestamp: string;

  @ApiProperty({ enum: ['up', 'down'] })
  database: 'up' | 'down';
}
