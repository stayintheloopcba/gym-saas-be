import { Role } from '../../permissions/domain/role.entity';

export const ROLE_REPOSITORY = Symbol('ROLE_REPOSITORY');

/** Port de persistencia del catálogo global de roles. Las búsquedas excluyen soft-deleted. */
export interface RoleRepository {
  findById(id: string): Promise<Role | null>;
  findByKey(key: string): Promise<Role | null>;
  listAll(): Promise<Role[]>;
  save(role: Role): Promise<Role>;
  softDelete(id: string): Promise<void>;
}
