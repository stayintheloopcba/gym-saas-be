import { Injectable } from '@nestjs/common';
import { FileTooLargeError, InvalidFileTypeError, MissingFileError } from '../domain/storage.errors';

/** Tipos de imagen permitidos para logos, banners y avatares. */
export const ALLOWED_IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'] as const;

export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

/** Tamaño máximo de subida (2 MB). */
export const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;

/** Extensión por MIME type, para construir keys legibles. */
const EXTENSION_BY_MIME: Record<AllowedImageMimeType, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
};

/** Subconjunto de `Express.Multer.File` que necesita la validación. */
export interface UploadCandidate {
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/**
 * Validación reutilizable de subidas de imagen: tipo permitido
 * (`png`/`jpeg`/`webp`/`svg`) y tamaño máximo. Compartida por los endpoints de
 * logo, banner y avatar. Lanza errores de dominio (`400`/`413`) que el filtro
 * global traduce.
 */
@Injectable()
export class ImageUploadValidator {
  validate(file: UploadCandidate | undefined): asserts file is UploadCandidate {
    if (!file) {
      throw new MissingFileError();
    }
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype as AllowedImageMimeType)) {
      throw new InvalidFileTypeError(file.mimetype, ALLOWED_IMAGE_MIME_TYPES);
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      throw new FileTooLargeError(file.size, MAX_IMAGE_SIZE_BYTES);
    }
  }

  /** Extensión de archivo correspondiente al MIME type ya validado. */
  extensionFor(mimetype: string): string {
    return EXTENSION_BY_MIME[mimetype as AllowedImageMimeType] ?? 'bin';
  }
}
