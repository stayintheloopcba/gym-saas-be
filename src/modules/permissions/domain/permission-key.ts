import { MembershipRole } from '../../../common/enums/membership-role.enum';

export const PERMISSIONS = {
  ORGANIZATION_READ: 'organization:read',
  ORGANIZATION_UPDATE: 'organization:update',
  ORGANIZATION_DELETE: 'organization:delete',
  MEMBERS_READ: 'members:read',
  MEMBERS_INVITE: 'members:invite',
  MEMBERS_UPDATE_ROLE: 'members:update_role',
  MEMBERS_REMOVE: 'members:remove',
  ROLES_READ: 'roles:read',
  ROLES_CREATE: 'roles:create',
  ROLES_UPDATE: 'roles:update',
  ROLES_DELETE: 'roles:delete',
  PERMISSIONS_MANAGE: 'permissions:manage',
  USERS_READ: 'users:read',
  RESOURCES_READ: 'resources:read',
  RESOURCES_CREATE: 'resources:create',
  RESOURCES_UPDATE: 'resources:update',
  RESOURCES_DELETE: 'resources:delete',
  SETTINGS_READ: 'settings:read',
  SETTINGS_UPDATE: 'settings:update',
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** Universo completo de códigos de permiso conocidos por el sistema. */
export const ALL_PERMISSIONS: readonly PermissionKey[] = Object.values(PERMISSIONS);

export const DEFAULT_ROLE_PERMISSIONS: Record<MembershipRole, readonly PermissionKey[]> = {
  [MembershipRole.OWNER]: ALL_PERMISSIONS,
  [MembershipRole.ADMIN]: ALL_PERMISSIONS.filter((permission) => permission !== PERMISSIONS.ORGANIZATION_DELETE),
  [MembershipRole.MEMBER]: [
    PERMISSIONS.ORGANIZATION_READ,
    PERMISSIONS.MEMBERS_READ,
    PERMISSIONS.RESOURCES_READ,
    PERMISSIONS.RESOURCES_CREATE,
    PERMISSIONS.RESOURCES_UPDATE,
    PERMISSIONS.SETTINGS_READ,
  ],
  [MembershipRole.VIEWER]: [
    PERMISSIONS.ORGANIZATION_READ,
    PERMISSIONS.MEMBERS_READ,
    PERMISSIONS.RESOURCES_READ,
    PERMISSIONS.SETTINGS_READ,
  ],
};
