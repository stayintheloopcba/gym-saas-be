import { Role } from '../../permissions/domain/role.entity';

export interface RoleView {
  id: string;
  key: string;
  name: string;
  description: string | null;
  hierarchyLevel: number;
  createdAt: Date;
}

export function toRoleView(role: Role): RoleView {
  return {
    id: role.id,
    key: role.key,
    name: role.name,
    description: role.description ?? null,
    hierarchyLevel: role.hierarchyLevel,
    createdAt: role.createdAt,
  };
}
