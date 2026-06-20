/** Token de inyección para el port de almacenamiento de archivos. */
export const FILE_STORAGE = Symbol('FILE_STORAGE');

/** Archivo a almacenar: contenido binario + metadatos mínimos. */
export interface StorableFile {
  /** Key/ruta del objeto dentro del bucket (p. ej. `org/<id>/logo-<uuid>.png`). */
  key: string;
  /** Contenido binario del archivo. */
  buffer: Buffer;
  /** MIME type del archivo (p. ej. `image/png`). */
  contentType: string;
}

/**
 * Port de dominio para persistir archivos en un almacenamiento S3-compatible.
 *
 * Mantiene la aplicación agnóstica del cliente concreto (MinIO/S3): los casos de
 * uso solo conocen esta interfaz. El adapter de infraestructura
 * (`MinioFileStorage`) implementa el acceso real y asegura el bucket al arrancar.
 */
export interface FileStorage {
  /**
   * Sube `file` al almacenamiento y devuelve su URL pública de lectura.
   */
  put(file: StorableFile): Promise<string>;
}
