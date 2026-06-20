import { Session } from './session.entity';

export const SESSION_REPOSITORY = Symbol('SESSION_REPOSITORY');

export type SessionRotationResult = 'rotated' | 'invalid' | 'reused';

export interface SessionRepository {
  save(session: Session): Promise<Session>;
  isActive(userId: string, sessionId: string): Promise<boolean>;
  findActiveByUser(userId: string): Promise<Session[]>;
  rotate(
    currentSessionId: string,
    userId: string,
    refreshTokenHash: string,
    replacement: Session,
  ): Promise<SessionRotationResult>;
  revokeOwned(userId: string, sessionId: string): Promise<boolean>;
  revokeAllExcept(userId: string, excludedSessionId: string): Promise<number>;
}
