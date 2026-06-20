import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, MoreThan, Not, Repository } from 'typeorm';
import { Session } from '../domain/session.entity';
import { SessionRepository, SessionRotationResult } from '../domain/session.repository';

@Injectable()
export class TypeOrmSessionRepository implements SessionRepository {
  constructor(
    @InjectRepository(Session) private readonly repo: Repository<Session>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  save(session: Session): Promise<Session> {
    return this.repo.save(session);
  }

  async isActive(userId: string, sessionId: string): Promise<boolean> {
    return (
      (await this.repo.count({
        where: { id: sessionId, userId, revokedAt: IsNull(), expiresAt: MoreThan(new Date()) },
      })) > 0
    );
  }

  findActiveByUser(userId: string): Promise<Session[]> {
    return this.repo.find({
      where: { userId, revokedAt: IsNull(), expiresAt: MoreThan(new Date()) },
      order: { createdAt: 'DESC' },
    });
  }

  rotate(
    currentSessionId: string,
    userId: string,
    refreshTokenHash: string,
    replacement: Session,
  ): Promise<SessionRotationResult> {
    return this.dataSource.transaction(async (manager) => {
      const sessions = manager.getRepository(Session);
      const current = await sessions.findOne({
        where: { id: currentSessionId },
        lock: { mode: 'pessimistic_write' },
        withDeleted: true,
      });

      if (
        !current ||
        current.userId !== userId ||
        current.refreshTokenHash !== refreshTokenHash ||
        current.expiresAt.getTime() <= Date.now()
      ) {
        return 'invalid';
      }

      if (current.revokedAt) {
        await sessions.update(
          { familyId: current.familyId, revokedAt: IsNull() },
          { revokedAt: new Date(), updatedBy: userId },
        );
        return 'reused';
      }

      const now = new Date();
      current.revokedAt = now;
      current.lastUsedAt = now;
      current.replacedBySessionId = replacement.id;
      current.updatedBy = userId;
      replacement.familyId = current.familyId;
      await sessions.save(current);
      await sessions.save(replacement);
      return 'rotated';
    });
  }

  async revokeOwned(userId: string, sessionId: string): Promise<boolean> {
    const result = await this.repo.update(
      { id: sessionId, userId, revokedAt: IsNull() },
      { revokedAt: new Date(), updatedBy: userId },
    );
    return (result.affected ?? 0) > 0;
  }

  async revokeAllExcept(userId: string, excludedSessionId: string): Promise<number> {
    const result = await this.repo.update(
      { userId, id: Not(excludedSessionId), revokedAt: IsNull() },
      { revokedAt: new Date(), updatedBy: userId },
    );
    return result.affected ?? 0;
  }
}
