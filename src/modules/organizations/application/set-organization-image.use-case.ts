import { randomUUID } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import { OrganizationPermissionService } from '../../permissions/application/organization-permission.service';
import { PERMISSIONS } from '../../permissions/domain/permission-key';
import { FILE_STORAGE } from '../../storage/domain/file-storage.port';
import type { FileStorage } from '../../storage/domain/file-storage.port';
import { ImageUploadValidator, UploadCandidate } from '../../storage/application/image-upload.validator';
import { Organization } from '../domain/organization.entity';
import { OrganizationNotFoundError } from '../domain/organization.errors';
import { ORGANIZATION_REPOSITORY } from '../domain/organization.repository';
import type { OrganizationRepository } from '../domain/organization.repository';

/** Imagen de marca que se puede subir a una organización. */
export type OrganizationImageTarget = 'logo' | 'banner';

/**
 * Sube el logo o el banner de una organización a MinIO y persiste su URL.
 *
 * Requiere `ORGANIZATION_UPDATE` del llamador. Valida tipo y tamaño de la imagen
 * (`ImageUploadValidator`) y genera una key con uuid para evitar enumeración y
 * cache stale (`org/<id>/<target>-<uuid>.<ext>`).
 */
@Injectable()
export class SetOrganizationImageUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY) private readonly organizations: OrganizationRepository,
    private readonly permissions: OrganizationPermissionService,
    @Inject(FILE_STORAGE) private readonly storage: FileStorage,
    private readonly validator: ImageUploadValidator,
  ) {}

  async execute(
    callerUserId: string,
    organizationId: string,
    target: OrganizationImageTarget,
    file: UploadCandidate | undefined,
  ): Promise<Organization> {
    await this.permissions.requirePermission(callerUserId, organizationId, PERMISSIONS.ORGANIZATION_UPDATE);
    this.validator.validate(file);

    const organization = await this.organizations.findById(organizationId);
    if (!organization) {
      throw new OrganizationNotFoundError(organizationId);
    }

    const key = `org/${organizationId}/${target}-${randomUUID()}.${this.validator.extensionFor(file.mimetype)}`;
    const url = await this.storage.put({ key, buffer: file.buffer, contentType: file.mimetype });

    if (target === 'logo') {
      organization.logoUrl = url;
    } else {
      organization.bannerUrl = url;
    }

    return this.organizations.save(organization);
  }
}
