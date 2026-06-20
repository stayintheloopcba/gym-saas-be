import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Index('idx_sessions_user_active', ['userId', 'revokedAt', 'expiresAt'])
@Index('idx_sessions_family', ['familyId'])
@Entity('sessions')
export class Session extends BaseEntity {
  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  public userId: string;

  @Column({ name: 'family_id', type: 'uuid' })
  public familyId: string;

  @Column({ name: 'refresh_token_hash', type: 'varchar', length: 64 })
  public refreshTokenHash: string;

  @Column({ name: 'expires_at', type: 'timestamp with time zone' })
  public expiresAt: Date;

  @Column({ name: 'last_used_at', type: 'timestamp with time zone', nullable: true })
  public lastUsedAt?: Date;

  @Column({ name: 'revoked_at', type: 'timestamp with time zone', nullable: true })
  public revokedAt?: Date;

  @Column({ name: 'replaced_by_session_id', type: 'uuid', nullable: true })
  public replacedBySessionId?: string;

  @Column({ name: 'user_agent', type: 'varchar', length: 512, nullable: true })
  public userAgent?: string;

  @Column({ name: 'ip_address', type: 'varchar', length: 64, nullable: true })
  public ipAddress?: string;
}
