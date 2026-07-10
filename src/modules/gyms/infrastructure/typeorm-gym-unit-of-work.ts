import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Membership } from '../../memberships/domain/membership.entity';
import { Role } from '../../permissions/domain/role.entity';
import { GymUnitOfWork } from '../application/gym-unit-of-work.port';
import { Gym } from '../domain/gym.entity';

const OWNER_ROLE_KEY = 'owner';

/**
 * Implementación TypeORM del `GymUnitOfWork`: persiste la organización y su
 * membresía `owner` dentro de una única `DataSource.transaction`, de modo que
 * nunca quede una org sin owner (Decision 5 del design).
 */
@Injectable()
export class TypeOrmGymUnitOfWork implements GymUnitOfWork {
  constructor(private readonly dataSource: DataSource) {}

  createGymWithOwner(gym: Gym, ownerUserId: string): Promise<Gym> {
    return this.dataSource.transaction(async (manager) => {
      const ownerRole = await manager.getRepository(Role).findOne({ where: { key: OWNER_ROLE_KEY } });
      if (!ownerRole) {
        throw new Error('The "owner" role is not seeded in the role catalog');
      }

      const savedOrg = await manager.getRepository(Gym).save(gym);

      const ownership = new Membership();
      ownership.userId = ownerUserId;
      ownership.gymId = savedOrg.id;
      ownership.roleId = ownerRole.id;
      await manager.getRepository(Membership).save(ownership);

      return savedOrg;
    });
  }
}
