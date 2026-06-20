import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MembershipContextPort } from '../../../common/context/membership-context.port';
import { Membership } from '../domain/membership.entity';

/**
 * Adapter del `MembershipContextPort` que consume `AuthContextMiddleware` para
 * validar la cookie `active_org`. Una única lectura indexada por
 * `(user_id, organization_id)` (los soft-deleted se excluyen): basta para
 * confirmar que el usuario es miembro activo de la organización.
 */
@Injectable()
export class TypeOrmMembershipContextAdapter implements MembershipContextPort {
  constructor(@InjectRepository(Membership) private readonly repo: Repository<Membership>) {}

  async isActiveMember(userId: string, organizationId: string): Promise<boolean> {
    const count = await this.repo.count({ where: { userId, organizationId } });
    return count > 0;
  }
}
