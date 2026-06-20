import { Injectable } from '@nestjs/common';
import { OwnershipValidator } from './ownership-validator';

/**
 * Registry de validators de ownership por `resourceType`. Cada recurso registra
 * el suyo (o un `DefaultOwnershipValidator`). `get` devuelve el validator
 * específico o, si no hay, el validator por defecto.
 */
@Injectable()
export class OwnershipValidatorRegistry {
  private readonly validators = new Map<string, OwnershipValidator>();
  private defaultValidator?: OwnershipValidator;

  register(validator: OwnershipValidator): void {
    this.validators.set(validator.resourceType, validator);
  }

  setDefault(validator: OwnershipValidator): void {
    this.defaultValidator = validator;
  }

  get(resourceType: string): OwnershipValidator | undefined {
    return this.validators.get(resourceType) ?? this.defaultValidator;
  }
}
