import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedPrincipal } from '../../auth/interfaces/jwt.strategy';
import { FindUserByIdUseCase } from '../../users/application/find-user.use-cases';

/**
 * Protege `/admin/*`: exige un usuario autenticado con `isPlatformAdmin = true`,
 * leído fresco de la base en cada request (no del JWT), para que una
 * revocación tenga efecto inmediato. Los permisos de organización no dan
 * acceso a esta superficie.
 */
@Injectable()
export class PlatformAdminGuard implements CanActivate {
  constructor(private readonly findUserById: FindUserByIdUseCase) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const principal = request.user as AuthenticatedPrincipal | undefined;
    if (!principal?.user.id) {
      throw new ForbiddenException('Authentication required');
    }

    const user = await this.findUserById.execute(principal.user.id);
    if (!user?.isPlatformAdmin) {
      throw new ForbiddenException('Platform admin access required');
    }

    return true;
  }
}
