import { Inject, Injectable } from '@nestjs/common';
import { MEMBER_REPOSITORY } from '../../members/domain/member.repository';
import type { MemberRepository } from '../../members/domain/member.repository';
import { PERMISSION_REPOSITORY } from '../../permissions/domain/permission.repository';
import type { PermissionRepository } from '../../permissions/domain/permission.repository';
import { RoleSummary } from '../../permissions/domain/role-summary';
import { Gym } from '../domain/gym.entity';
import { GYM_REPOSITORY } from '../domain/gym.repository';
import type { GymRepository } from '../domain/gym.repository';

/** Un gym del usuario junto con su rol del catálogo en él. */
export interface MyGym {
  gym: Gym;
  role: RoleSummary;
}

/**
 * Lista los gyms donde el usuario tiene un `Member` activo, con su rol en
 * cada uno. Los gyms eliminados se omiten (el `findById` no los devuelve).
 */
@Injectable()
export class ListMyGymsUseCase {
  constructor(
    @Inject(GYM_REPOSITORY) private readonly gyms: GymRepository,
    @Inject(MEMBER_REPOSITORY) private readonly members: MemberRepository,
    @Inject(PERMISSION_REPOSITORY) private readonly permissionsRepo: PermissionRepository,
  ) {}

  async execute(callerUserId: string): Promise<MyGym[]> {
    const members = await this.members.findByUserId(callerUserId);

    const result: MyGym[] = [];
    for (const member of members) {
      const [gym, role] = await Promise.all([
        this.gyms.findById(member.gymId),
        this.permissionsRepo.findRoleSummary(member.roleId),
      ]);
      if (gym && role) {
        result.push({ gym, role });
      }
    }
    return result;
  }
}
