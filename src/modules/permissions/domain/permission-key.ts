export const PERMISSIONS = {
  ORGANIZATION_READ: 'organization:read',
  ORGANIZATION_UPDATE: 'organization:update',
  ORGANIZATION_DELETE: 'organization:delete',
  MEMBERS_READ: 'members:read',
  MEMBERS_UPDATE_ROLE: 'members:update_role',
  MEMBERS_REMOVE: 'members:remove',
  ROLES_READ: 'roles:read',
  USERS_READ: 'users:read',
  SETTINGS_READ: 'settings:read',
  SETTINGS_UPDATE: 'settings:update',
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** Universo completo de códigos de permiso conocidos por el sistema. */
export const ALL_PERMISSIONS: readonly PermissionKey[] = Object.values(PERMISSIONS);
