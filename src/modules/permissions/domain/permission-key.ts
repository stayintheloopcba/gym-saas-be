export const PERMISSIONS = {
  ORGANIZATION_READ: 'organization:read',
  ORGANIZATION_UPDATE: 'organization:update',
  ORGANIZATION_DELETE: 'organization:delete',
  MEMBERS_READ: 'members:read',
  MEMBERS_INVITE: 'members:invite',
  MEMBERS_UPDATE_ROLE: 'members:update_role',
  MEMBERS_REMOVE: 'members:remove',
  ROLES_READ: 'roles:read',
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
