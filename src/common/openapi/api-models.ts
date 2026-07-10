import { ApiProperty } from '@nestjs/swagger';
import { AuthProvider } from '../enums/auth-provider.enum';

export class RoleSummaryModel {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'owner' })
  key: string;

  @ApiProperty({ example: 'Dueño' })
  name: string;
}

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

export class GymModel {
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
}

export class GymSettingsModel {
  @ApiProperty({ format: 'uuid' })
  gymId: string;

  @ApiProperty({ type: String, nullable: true, example: 'Acme Gym' })
  displayName: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'http://localhost:9000/generic-saas/gym/abc/logo-x.png' })
  logoUrl: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'http://localhost:9000/generic-saas/gym/abc/banner-x.png' })
  bannerUrl: string | null;

  @ApiProperty({ type: String, nullable: true, example: '#0F62FE' })
  primaryColor: string | null;

  @ApiProperty({ type: String, nullable: true, example: '#161616' })
  secondaryColor: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'Inter' })
  fontFamily: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'light' })
  theme: string | null;

  @ApiProperty({ example: 'America/Argentina/Buenos_Aires' })
  timezone: string;

  @ApiProperty({ example: 'ARS' })
  currency: string;

  @ApiProperty({ type: Object, nullable: true })
  openingHours: Record<string, unknown> | null;

  @ApiProperty({ type: String, nullable: true, format: 'email' })
  contactEmail: string | null;

  @ApiProperty({ type: String, nullable: true })
  contactPhone: string | null;

  @ApiProperty({ example: 5 })
  moraGraceDays: number;

  @ApiProperty({ example: 0 })
  moraSurchargePct: number;

  @ApiProperty({ type: Object, nullable: true })
  renewalPolicy: Record<string, unknown> | null;

  @ApiProperty({ type: String, isArray: true, example: ['CASH'] })
  enabledPaymentMethods: string[];
}

export class GymWithRoleModel extends GymModel {
  @ApiProperty({ type: RoleSummaryModel })
  role: RoleSummaryModel;
}

export class GymMemberModel {
  @ApiProperty({ format: 'uuid' })
  membershipId: string;

  @ApiProperty({ type: RoleSummaryModel })
  role: RoleSummaryModel;

  @ApiProperty({ type: UserPublicProfileModel })
  user: UserPublicProfileModel;
}

export class BranchModel {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  gymId: string;

  @ApiProperty({ example: 'Downtown' })
  name: string;

  @ApiProperty({ type: String, nullable: true })
  address: string | null;

  @ApiProperty({ type: String, nullable: true })
  phone: string | null;

  @ApiProperty({ type: Object, nullable: true })
  openingHours: Record<string, unknown> | null;

  @ApiProperty({ type: Number, nullable: true })
  capacity: number | null;

  @ApiProperty()
  active: boolean;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;
}

export class DisciplineModel {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'CROSSFIT' })
  code: string;

  @ApiProperty({ example: 'Crossfit' })
  name: string;

  @ApiProperty()
  active: boolean;
}

export class PlanModel {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  gymId: string;

  @ApiProperty({ example: 'Full access' })
  name: string;

  @ApiProperty({ example: 15000 })
  price: number;

  @ApiProperty({ example: 'ARS' })
  currency: string;

  @ApiProperty({ enum: ['WEEKLY', 'MONTHLY', 'QUARTERLY', 'BIANNUAL', 'ANNUAL'] })
  periodicity: string;

  @ApiProperty({ type: Number, nullable: true, description: 'null = unlimited' })
  visitsPerMonth: number | null;

  @ApiProperty({ type: Object, nullable: true })
  timeWindow: Record<string, unknown> | null;

  @ApiProperty()
  active: boolean;

  @ApiProperty({ type: String, isArray: true, format: 'uuid' })
  branchIds: string[];

  @ApiProperty({ type: String, isArray: true, format: 'uuid' })
  disciplineIds: string[];

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;
}

export class SubscriptionModel {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  gymId: string;

  @ApiProperty({ format: 'uuid' })
  memberId: string;

  @ApiProperty({ format: 'uuid' })
  planId: string;

  @ApiProperty({ type: String, format: 'date' })
  startDate: string;

  @ApiProperty({ type: String, format: 'date', nullable: true })
  endDate: string | null;

  @ApiProperty({ type: String, format: 'date', nullable: true })
  paidUntil: string | null;

  @ApiProperty({ enum: ['ACTIVE', 'EXPIRED', 'CANCELLED'] })
  status: string;

  @ApiProperty({ enum: ['AUTO', 'MANUAL'] })
  renewalMode: string;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;
}

export class MemberModel {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  gymId: string;

  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  userId: string | null;

  @ApiProperty({ type: RoleSummaryModel })
  role: RoleSummaryModel;

  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  branchId: string | null;

  @ApiProperty({ example: 'Ada' })
  firstName: string;

  @ApiProperty({ example: 'Lovelace' })
  lastName: string;

  @ApiProperty({ type: String, nullable: true, example: '30111222' })
  documentId: string | null;

  @ApiProperty({ type: String, nullable: true, format: 'email' })
  email: string | null;

  @ApiProperty({ type: String, nullable: true })
  phone: string | null;

  @ApiProperty({ type: String, nullable: true, format: 'date' })
  birthDate: string | null;

  @ApiProperty({ type: String, nullable: true })
  photoUrl: string | null;

  @ApiProperty({ type: String, nullable: true })
  emergencyContactName: string | null;

  @ApiProperty({ type: String, nullable: true })
  emergencyContactPhone: string | null;

  @ApiProperty({ enum: ['ACTIVE', 'SUSPENDED', 'OVERDUE', 'INACTIVE'] })
  status: string;

  @ApiProperty({ type: Object, nullable: true })
  consents: Record<string, unknown> | null;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;
}

export class MyPermissionsModel {
  @ApiProperty({ format: 'uuid' })
  gymId: string;

  @ApiProperty({ type: RoleSummaryModel })
  role: RoleSummaryModel;

  @ApiProperty({
    description: 'Data scope of the current user: SELF=1, GYM=5, GLOBAL=10.',
    example: 5,
  })
  hierarchyLevel: number;

  @ApiProperty({
    type: String,
    isArray: true,
    description: 'Effective permission codes (resource:action) granted to the current user.',
    example: ['gym:read', 'members:read', 'resources:create'],
  })
  permissions: string[];
}

export class RoleViewModel {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'owner', description: 'Stable, immutable kebab-case slug.' })
  key: string;

  @ApiProperty({ example: 'Dueño' })
  name: string;

  @ApiProperty({ type: String, nullable: true, example: 'Manages billing and invoices' })
  description: string | null;

  @ApiProperty({ description: 'Data scope of the role: SELF=1, GYM=5, GLOBAL=10.', example: 5 })
  hierarchyLevel: number;

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

export class OnboardingStatusModel {
  @ApiProperty()
  needsOnboarding: boolean;

  @ApiProperty({ minimum: 0 })
  gymsCount: number;

  @ApiProperty()
  hasActiveGym: boolean;

  @ApiProperty({ format: 'uuid', nullable: true })
  activeGymId: string | null;
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
