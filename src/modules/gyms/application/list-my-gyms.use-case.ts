import { Inject, Injectable } from '@nestjs/common';
import { MEMBERSHIP_REPOSITORY } from '../../memberships/domain/membership.repository';
import type { MembershipRepository } from '../../memberships/domain/membership.repository';
import { PERMISSION_REPOSITORY } from '../../permissions/domain/permission.repository';
import type { PermissionRepository } from '../../permissions/domain/permission.repository';
import { RoleSummary } from '../../permissions/domain/role-summary';
import { Gym } from '../domain/gym.entity';
import { GYM_REPOSITORY } from '../domain/gym.repository';
import type { GymRepository } from '../domain/gym.repository';

/** Una organización del usuario junto con su rol del catálogo en ella. */
export interface MyGym {
  gym: Gym;
  role: RoleSummary;
}

/**
 * Lista las organizaciones donde el usuario tiene una membresía activa, con su
 * rol en cada una. Las orgs eliminadas se omiten (el `findById` no las devuelve).
 */
@Injectable()
export class ListMyGymsUseCase {
  constructor(
    @Inject(GYM_REPOSITORY) private readonly gyms: GymRepository,
    @Inject(MEMBERSHIP_REPOSITORY) private readonly memberships: MembershipRepository,
    @Inject(PERMISSION_REPOSITORY) private readonly permissionsRepo: PermissionRepository,
  ) {}

  async execute(callerUserId: string): Promise<MyGym[]> {
    const memberships = await this.memberships.findByUser(callerUserId);

    const result: MyGym[] = [];
    for (const membership of memberships) {
      const [gym, role] = await Promise.all([
        this.gyms.findById(membership.gymId),
        this.permissionsRepo.findRoleSummary(membership.roleId),
      ]);
      if (gym && role) {
        result.push({ gym, role });
      }
    }
    return result;
  }
}
