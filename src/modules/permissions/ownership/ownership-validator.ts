import { OwnershipContext } from './ownership-context';

/**
 * Resultado de validar ownership: se separa `found` de `owned` para que el guard
 * pueda distinguir 404 (no existe) de 403 (existe pero no autorizado).
 */
export interface OwnershipResult {
  found: boolean;
  owned: boolean;
}

/**
 * Decide si un usuario "posee" (puede actuar sobre) un recurso concreto según su
 * `OwnershipContext`. Cada recurso registra su validator en el
 * `OwnershipValidatorRegistry`, identificado por `resourceType`.
 */
export interface OwnershipValidator {
  readonly resourceType: string;
  validate(resourceId: string, context: OwnershipContext): Promise<OwnershipResult>;
}
