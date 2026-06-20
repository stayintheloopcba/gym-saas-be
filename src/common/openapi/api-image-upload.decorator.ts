import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';

/** Nombre del campo multipart que transporta el archivo en las subidas de imagen. */
export const UPLOAD_FILE_FIELD = 'file';

/**
 * Decorador compuesto para endpoints de subida de una imagen vía `multipart/form-data`.
 *
 * Registra el `FileInterceptor` (memoryStorage por defecto → `file.buffer`
 * disponible) y documenta el body en OpenAPI. La validación de tipo/tamaño la hace
 * `ImageUploadValidator` en el caso de uso, no aquí, para devolver errores de
 * dominio precisos (`400`/`413`).
 */
export function ApiImageUpload(): MethodDecorator {
  return applyDecorators(
    UseInterceptors(FileInterceptor(UPLOAD_FILE_FIELD)),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      required: true,
      schema: {
        type: 'object',
        required: [UPLOAD_FILE_FIELD],
        properties: {
          [UPLOAD_FILE_FIELD]: { type: 'string', format: 'binary' },
        },
      },
    }),
  );
}
