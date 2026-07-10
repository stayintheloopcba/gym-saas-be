import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Member } from '../../members/domain/member.entity';
import { MemberStatus } from '../../members/domain/member-status.enum';
import { Role } from '../../permissions/domain/role.entity';
import { User } from '../../users/domain/user.entity';
import { GymUnitOfWork } from '../application/gym-unit-of-work.port';
import { Gym } from '../domain/gym.entity';

const OWNER_ROLE_KEY = 'owner';

/**
 * Implementación TypeORM del `GymUnitOfWork`: persiste el gym y el `Member`
 * `owner` (con los datos personales tomados del `User` creador) dentro de una
 * única `DataSource.transaction`, de modo que nunca quede un gym sin owner
 * (Decision 5 del design).
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

      const owner = await manager.getRepository(User).findOne({ where: { id: ownerUserId } });
      if (!owner) {
        throw new Error(`Owner user not found: ${ownerUserId}`);
      }

      const savedGym = await manager.getRepository(Gym).save(gym);

      const [firstName, ...rest] = owner.name.trim().split(/\s+/);
      const member = new Member();
      member.gymId = savedGym.id;
      member.userId = ownerUserId;
      member.roleId = ownerRole.id;
      member.branchId = null;
      member.firstName = firstName;
      member.lastName = rest.join(' ') || firstName;
      member.documentId = null;
      member.email = owner.email;
      member.phone = null;
      member.birthDate = null;
      member.photoUrl = null;
      member.emergencyContactName = null;
      member.emergencyContactPhone = null;
      member.status = MemberStatus.ACTIVE;
      member.consents = null;
      await manager.getRepository(Member).save(member);

      return savedGym;
    });
  }
}
