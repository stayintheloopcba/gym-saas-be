import { MembershipRole } from '../../../common/enums/membership-role.enum';
import { Role } from '../../permissions/domain/role.entity';

export interface RoleView {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  systemKey: MembershipRole | null;
  hierarchyLevel: number;
  organizationId: string | null;
  createdAt: Date;
}

export function toRoleView(role: Role): RoleView {
  return {
    id: role.id,
    name: role.name,
    description: role.description ?? null,
    isSystem: role.isSystem,
    systemKey: role.systemKey,
    hierarchyLevel: role.hierarchyLevel,
    organizationId: role.organizationId,
    createdAt: role.createdAt,
  };
}
