import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { InvitationStatus } from '../../../common/enums/invitation-status.enum';
import { Invitation } from '../domain/invitation.entity';
import { InvitationRepository } from '../domain/invitation.repository';

/**
 * Implementación TypeORM del port `InvitationRepository`. Las búsquedas excluyen
 * soft-deleted; "pending" se filtra por `status = PENDING` (la expiración se
 * evalúa en la aplicación). `save` acepta el `EntityManager` de la transacción de
 * aceptación.
 */
@Injectable()
export class TypeOrmInvitationRepository implements InvitationRepository {
  constructor(@InjectRepository(Invitation) private readonly repo: Repository<Invitation>) {}

  findById(id: string): Promise<Invitation | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByToken(token: string): Promise<Invitation | null> {
    return this.repo.findOne({ where: { token } });
  }

  findPendingByOrgAndEmail(organizationId: string, email: string): Promise<Invitation | null> {
    return this.repo.findOne({ where: { organizationId, email, status: InvitationStatus.PENDING } });
  }

  findPendingByOrg(organizationId: string): Promise<Invitation[]> {
    return this.repo.find({ where: { organizationId, status: InvitationStatus.PENDING } });
  }

  findPendingByEmail(email: string): Promise<Invitation[]> {
    return this.repo.find({ where: { email, status: InvitationStatus.PENDING } });
  }

  countPendingByRole(roleId: string): Promise<number> {
    return this.repo.count({ where: { roleId, status: InvitationStatus.PENDING } });
  }

  save(invitation: Invitation, manager?: EntityManager): Promise<Invitation> {
    const repo = manager ? manager.getRepository(Invitation) : this.repo;
    return repo.save(invitation);
  }
}
