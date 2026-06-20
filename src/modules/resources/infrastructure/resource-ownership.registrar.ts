import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DefaultOwnershipValidator } from '../../permissions/ownership/default-ownership.validator';
import { OwnershipValidatorRegistry } from '../../permissions/ownership/ownership-validator-registry';
import { Resource } from '../domain/resource.entity';

/** `resourceType` con el que el módulo de Resources registra su ownership. */
export const RESOURCE_OWNERSHIP_TYPE = 'resource';

/**
 * Registra en el `OwnershipValidatorRegistry` el validator por defecto para
 * `Resource`, cargando el registro por id (sin scope) para resolver found/owned.
 */
@Injectable()
export class ResourceOwnershipRegistrar implements OnModuleInit {
  constructor(
    @InjectRepository(Resource) private readonly resources: Repository<Resource>,
    private readonly registry: OwnershipValidatorRegistry,
  ) {}

  onModuleInit(): void {
    this.registry.register(
      new DefaultOwnershipValidator(RESOURCE_OWNERSHIP_TYPE, (id) =>
        this.resources.findOne({
          where: { id },
          select: { id: true, organizationId: true, createdBy: true },
        }),
      ),
    );
  }
}
