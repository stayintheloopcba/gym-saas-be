import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Membership } from '../../memberships/domain/membership.entity';
import { InvitationUnitOfWork } from '../application/invitation-unit-of-work.port';
import { Invitation } from '../domain/invitation.entity';

/**
 * Implementación TypeORM del `InvitationUnitOfWork`: crea la membresía y marca la
 * invitación `ACCEPTED` en una única `DataSource.transaction`, evitando estados a
 * medias en la aceptación.
 */
@Injectable()
export class TypeOrmInvitationUnitOfWork implements InvitationUnitOfWork {
  constructor(private readonly dataSource: DataSource) {}

  acceptInvitation(membership: Membership, invitation: Invitation): Promise<Membership> {
    return this.dataSource.transaction(async (manager) => {
      const saved = await manager.getRepository(Membership).save(membership);
      await manager.getRepository(Invitation).save(invitation);
      return saved;
    });
  }
}
