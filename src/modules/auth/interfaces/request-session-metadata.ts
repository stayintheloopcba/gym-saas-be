import type { Request } from 'express';
import type { SessionMetadata } from '../../sessions/application/session.service';

export function requestSessionMetadata(request: Request): SessionMetadata {
  return {
    userAgent: request.get('user-agent'),
    ipAddress: request.ip,
  };
}
