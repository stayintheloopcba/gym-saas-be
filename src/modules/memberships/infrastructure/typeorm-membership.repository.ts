import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { MembershipRole } from '../../../common/enums/membership-role.enum';
import { Membership } from '../domain/membership.entity';
import { MembershipRepository } from '../domain/membership.repository';

/**
 * Implementación TypeORM del port `MembershipRepository`.
 *
 * Las búsquedas excluyen registros soft-deleted (TypeORM respeta
 * `@DeleteDateColumn`). `save` usa el `EntityManager` de la transacción cuando se
 * le pasa, para participar en commits atómicos (org+owner, accept invitation).
 */
@Injectable()
export class TypeOrmMembershipRepository implements MembershipRepository {
  constructor(@InjectRepository(Membership) private readonly repo: Repository<Membership>) {}

  findByUserAndOrg(userId: string, organizationId: string): Promise<Membership | null> {
    return this.repo.findOne({ where: { userId, organizationId } });
  }

  findByUser(userId: string): Promise<Membership[]> {
    return this.repo.find({ where: { userId } });
  }

  findByOrg(organizationId: string): Promise<Membership[]> {
    return this.repo.find({ where: { organizationId } });
  }

  countOwners(organizationId: string): Promise<number> {
    return this.repo.count({ where: { organizationId, role: MembershipRole.OWNER } });
  }

  countByRole(roleId: string): Promise<number> {
    return this.repo.count({ where: { roleId } });
  }

  save(membership: Membership, manager?: EntityManager): Promise<Membership> {
    const repo = manager ? manager.getRepository(Membership) : this.repo;
    return repo.save(membership);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
