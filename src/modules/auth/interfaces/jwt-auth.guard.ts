import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard que protege rutas exigiendo un access token válido en la cookie.
 * Apóyate en la `JwtStrategy` (estrategia 'jwt' por defecto de Passport).
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
