import { SetMetadata } from '@nestjs/common';
import type { Request } from 'express';
import { PermissionKey } from '../../modules/permissions/domain/permission-key';

export const REQUIRED_PERMISSIONS_KEY = 'required_permissions';

export interface RequirePermissionsOptions {
  permission: PermissionKey | PermissionKey[];
  organizationId?: (request: Request) => string | undefined;
  /** `resourceType` a validar por ownership (debe tener un validator registrado). */
  resource?: string;
  /** Extrae el id del recurso desde el request para el chequeo de ownership. */
  resourceId?: (request: Request) => string | undefined;
  /** Si es `true`, omite el chequeo de ownership aunque haya `resource`/`resourceId`. */
  skipOwnership?: boolean;
}

export const RequirePermissions = (
  permissionOrOptions: PermissionKey | PermissionKey[] | RequirePermissionsOptions,
): MethodDecorator => {
  const options: RequirePermissionsOptions =
    typeof permissionOrOptions === 'string' || Array.isArray(permissionOrOptions)
      ? { permission: permissionOrOptions }
      : permissionOrOptions;
  return SetMetadata(REQUIRED_PERMISSIONS_KEY, options);
};
