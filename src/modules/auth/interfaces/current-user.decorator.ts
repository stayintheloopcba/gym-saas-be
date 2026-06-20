import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { UserPublicProfile } from '../../users/application/user-public-profile';
import { AuthenticatedPrincipal } from './jwt.strategy';

/**
 * Inyecta el usuario autenticado (lo que devuelve `JwtStrategy.validate`) en el
 * handler. Solo tiene valor en rutas protegidas por `JwtAuthGuard`.
 */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): UserPublicProfile => {
  const request = ctx.switchToHttp().getRequest<Request>();
  return (request.user as AuthenticatedPrincipal).user;
});

export const CurrentSessionId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<Request>();
  return (request.user as AuthenticatedPrincipal).sessionId;
});
