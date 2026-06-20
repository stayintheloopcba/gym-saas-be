import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { AuthContextService } from '../context/auth-context.service';

/**
 * Guard de rutas de negocio: exige una organización activa válida en el request.
 *
 * - Si no hay organización activa (`AuthContextService.getActiveOrganizationId()`
 *   es `undefined`) responde `403` — encarna la regla "sin organización no se
 *   accede al dashboard".
 * - Para rutas org-scoped (`:id` en el path) exige además que el `:id` coincida
 *   con la organización activa (defensa en profundidad: no operar sobre una org
 *   ajena cuyo id se adivinó).
 *
 * Las rutas de onboarding/cuenta NO lo usan; van solo con `JwtAuthGuard`.
 */
@Injectable()
export class ActiveOrgGuard implements CanActivate {
  constructor(private readonly authContext: AuthContextService) {}

  canActivate(context: ExecutionContext): boolean {
    const activeOrganizationId = this.authContext.getActiveOrganizationId();
    if (!activeOrganizationId) {
      throw new ForbiddenException('No active organization selected');
    }

    const request = context.switchToHttp().getRequest<Request>();
    const pathOrganizationId = request.params?.id;
    if (pathOrganizationId && pathOrganizationId !== activeOrganizationId) {
      throw new ForbiddenException('Path organization does not match the active organization');
    }

    return true;
  }
}
