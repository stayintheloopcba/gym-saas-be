export const PERMISSIONS = {
  GYM_READ: 'gym:read',
  GYM_UPDATE: 'gym:update',
  GYM_DELETE: 'gym:delete',
  MEMBERS_READ: 'members:read',
  MEMBERS_CREATE: 'members:create',
  MEMBERS_UPDATE: 'members:update',
  MEMBERS_UPDATE_ROLE: 'members:update_role',
  MEMBERS_REMOVE: 'members:remove',
  ROLES_READ: 'roles:read',
  USERS_READ: 'users:read',
  SETTINGS_READ: 'settings:read',
  SETTINGS_UPDATE: 'settings:update',
  BRANCHES_READ: 'branches:read',
  BRANCHES_MANAGE: 'branches:manage',
  PLANS_READ: 'plans:read',
  PLANS_MANAGE: 'plans:manage',
  SUBSCRIPTIONS_READ: 'subscriptions:read',
  SUBSCRIPTIONS_MANAGE: 'subscriptions:manage',
  PAYMENTS_READ: 'payments:read',
  PAYMENTS_RECORD: 'payments:record',
  PAYMENTS_VOID: 'payments:void',
  ACCESS_READ: 'access:read',
  ACCESS_CHECKIN: 'access:checkin',
  ROUTINES_READ: 'routines:read',
  ROUTINES_MANAGE: 'routines:manage',
  ROUTINES_ASSIGN: 'routines:assign',
  PROGRESS_READ: 'progress:read',
  PROGRESS_RECORD: 'progress:record',
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** Universo completo de códigos de permiso conocidos por el sistema. */
export const ALL_PERMISSIONS: readonly PermissionKey[] = Object.values(PERMISSIONS);
