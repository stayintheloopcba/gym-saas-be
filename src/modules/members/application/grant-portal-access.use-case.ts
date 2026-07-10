import { Inject, Injectable } from '@nestjs/common';
import { AuthProvider } from '../../../common/enums/auth-provider.enum';
import { GymPermissionService } from '../../permissions/application/gym-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { PERMISSION_REPOSITORY } from '../../permissions/domain/permission.repository';
import type { PermissionRepository } from '../../permissions/domain/permission.repository';
import { CreateUserUseCase } from '../../users/application/create-user.use-case';
import { FindUserByEmailUseCase } from '../../users/application/find-user.use-cases';
import { DuplicateMemberError, MemberAlreadyLinkedError, MemberNotFoundError } from '../domain/member.errors';
import { MEMBER_REPOSITORY } from '../domain/member.repository';
import type { MemberRepository } from '../domain/member.repository';
import { MemberView, toMemberView } from '../interfaces/member.view';

export interface GrantPortalAccessCommand {
  callerUserId: string;
  gymId: string;
  memberId: string;
  email: string;
}

/**
 * Otorga acceso al portal a un `Member` sin cuenta: vincula un `User`
 * existente por email o crea uno nuevo (LOCAL, sin password — el set-password
 * se resuelve vía el mecanismo de auth existente, ver Decision #7 técnica).
 *
 * 409 si el member ya tiene una cuenta vinculada, o si el `User` encontrado
 * ya tiene otro `Member` en este mismo gym (partial unique `(gymId, userId)`).
 */
@Injectable()
export class GrantPortalAccessUseCase {
  constructor(
    @Inject(MEMBER_REPOSITORY) private readonly members: MemberRepository,
    @Inject(PERMISSION_REPOSITORY) private readonly permissionsRepo: PermissionRepository,
    private readonly permissions: GymPermissionService,
    private readonly findUserByEmail: FindUserByEmailUseCase,
    private readonly createUser: CreateUserUseCase,
  ) {}

  async execute(command: GrantPortalAccessCommand): Promise<MemberView> {
    const { callerUserId, gymId, memberId, email } = command;

    await this.permissions.requirePermission(callerUserId, gymId, PERMISSIONS.MEMBERS_UPDATE);

    const member = await this.members.findById(gymId, memberId);
    if (!member) {
      throw new MemberNotFoundError(memberId);
    }
    if (member.userId) {
      throw new MemberAlreadyLinkedError();
    }

    let user = await this.findUserByEmail.execute(email);
    if (user) {
      const existingMember = await this.members.findByGymAndUserId(gymId, user.id);
      if (existingMember) {
        throw new DuplicateMemberError('userId');
      }
    } else {
      const name = `${member.firstName} ${member.lastName}`.trim();
      user = await this.createUser.execute({ email, name, provider: AuthProvider.LOCAL });
    }

    member.userId = user.id;
    const saved = await this.members.save(member);

    const role = await this.permissionsRepo.findRoleSummary(saved.roleId);
    if (!role) {
      throw new MemberNotFoundError(memberId);
    }
    return toMemberView(saved, role);
  }
}
