import { hasGlobalAccess, hasOrganizationAccess } from '../../../common/enums/hierarchy-level.enum';
import { OwnershipContext } from './ownership-context';
import { OwnershipResult, OwnershipValidator } from './ownership-validator';

/** Atributos mínimos que el validator por defecto necesita de un recurso. */
export interface OwnedResource {
  organizationId?: string | null;
  createdBy?: string | null;
}

/** Carga un recurso por id (sin scope), o `null` si no existe. */
export type OwnedResourceLoader = (resourceId: string) => Promise<OwnedResource | null>;

/**
 * Validator por defecto reutilizable por CRUDs genéricos: resuelve ownership a
 * partir de `createdBy` (SELF) y `organizationId` (ORGANIZATION) del recurso.
 *
 * - `GLOBAL` → acceso a cualquier recurso existente.
 * - `ORGANIZATION` → solo recursos de la organización activa.
 * - `SELF` → solo recursos de la organización activa creados por el usuario.
 *
 * Se construye con un `loader` (típicamente envuelve un repositorio) para no
 * acoplar el validator a TypeORM ni a una entidad concreta.
 */
export class DefaultOwnershipValidator implements OwnershipValidator {
  constructor(
    public readonly resourceType: string,
    private readonly load: OwnedResourceLoader,
  ) {}

  async validate(resourceId: string, context: OwnershipContext): Promise<OwnershipResult> {
    const resource = await this.load(resourceId);
    if (!resource) {
      return { found: false, owned: false };
    }

    if (hasGlobalAccess(context.hierarchyLevel)) {
      return { found: true, owned: true };
    }

    const sameOrg = resource.organizationId === context.organizationId;
    if (hasOrganizationAccess(context.hierarchyLevel)) {
      return { found: true, owned: sameOrg };
    }

    // SELF: dentro de la organización activa y creado por el usuario.
    return { found: true, owned: sameOrg && resource.createdBy === context.userId };
  }
}
