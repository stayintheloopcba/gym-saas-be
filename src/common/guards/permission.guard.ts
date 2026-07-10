import { CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { REQUIRED_PERMISSIONS_KEY, RequirePermissionsOptions } from '../decorators/require-permissions.decorator';
import { AuthContextService } from '../context/auth-context.service';
import { GymPermissionService } from '../../modules/permissions/application/gym-permission.service';
import { OwnershipContextService } from '../../modules/permissions/application/ownership-context.service';
import { PermissionKey } from '../../modules/permissions/domain/permission-key';
import { OwnershipValidatorRegistry } from '../../modules/permissions/ownership/ownership-validator-registry';
import type { AuthenticatedPrincipal } from '../../modules/auth/interfaces/jwt.strategy';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authContext: AuthContextService,
    private readonly permissions: GymPermissionService,
    private readonly ownershipContext: OwnershipContextService,
    private readonly ownershipValidators: OwnershipValidatorRegistry,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<RequirePermissionsOptions>(REQUIRED_PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const principal = request.user as AuthenticatedPrincipal | undefined;
    const pathGymId = request.params?.id;
    const gymId =
      options.gymId?.(request) ??
      (Array.isArray(pathGymId) ? pathGymId[0] : pathGymId) ??
      this.authContext.getActiveGymId();
    if (!principal?.user.id || !gymId) {
      throw new ForbiddenException('An active gym is required');
    }

    const userId = principal.user.id;
    const hasPermission = await this.permissions.checkPermission(
      userId,
      gymId,
      options.permission as PermissionKey | PermissionKey[],
    );
    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }

    if (options.resource && options.resourceId && !options.skipOwnership) {
      await this.checkOwnership(request, options, userId, gymId);
    }

    return true;
  }

  private async checkOwnership(
    request: Request,
    options: RequirePermissionsOptions,
    userId: string,
    gymId: string,
  ): Promise<void> {
    const resourceId = options.resourceId?.(request);
    if (!resourceId) {
      throw new ForbiddenException('A resource id is required');
    }

    const validator = this.ownershipValidators.get(options.resource as string);
    if (!validator) {
      // Misconfiguración: una ruta exige ownership pero el recurso no tiene validator.
      throw new ForbiddenException('No ownership validator registered for this resource');
    }

    const ownershipContext = await this.ownershipContext.build(userId, gymId);
    if (!ownershipContext) {
      throw new ForbiddenException('An active gym is required');
    }

    const result = await validator.validate(resourceId, ownershipContext);
    if (!result.found) {
      throw new NotFoundException('Resource not found');
    }
    if (!result.owned) {
      throw new ForbiddenException('Insufficient permissions for this resource');
    }
  }
}
