import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard de la estrategia de Google. En `GET /auth/google` dispara la redirección
 * al consentimiento; en el callback valida el code y puebla `req.user` con el
 * `GoogleProfile`.
 */
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {}
