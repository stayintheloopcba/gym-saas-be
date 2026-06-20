import { Role } from '../../permissions/domain/role.entity';

export const ROLE_REPOSITORY = Symbol('ROLE_REPOSITORY');

/**
 * Port de persistencia de roles. Todas las búsquedas excluyen soft-deleted.
 * Los roles de sistema tienen `organizationId = null`; los custom, el id de su
 * organización.
 */
export interface RoleRepository {
  findById(id: string): Promise<Role | null>;
  /** Rol custom activo con ese nombre en la organización, o `null`. */
  findActiveByName(organizationId: string, name: string): Promise<Role | null>;
  /** Roles visibles para la organización: de sistema + custom de esa org. */
  listForOrganization(organizationId: string): Promise<Role[]>;
  save(role: Role): Promise<Role>;
  softDelete(id: string): Promise<void>;
}
