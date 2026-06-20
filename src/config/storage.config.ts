import { ConfigService } from '@nestjs/config';

/**
 * Configuración del almacenamiento de archivos (MinIO / S3-compatible) derivada de
 * variables de entorno. Estas mismas variables alimentan el servicio `minio` del
 * docker-compose y el adapter `MinioFileStorage`.
 *
 * `publicUrl` es la base con la que se construye la URL pública de lectura de cada
 * objeto (`<publicUrl>/<key>`). En dev apunta a la API S3 directa
 * (`http://localhost:9000/<bucket>`); en prod sería el dominio/CDN público.
 */
export interface StorageConfig {
  endPoint: string;
  port: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
  bucket: string;
  publicUrl: string;
}

export const buildStorageConfig = (config: ConfigService): StorageConfig => {
  const endPoint = config.get<string>('MINIO_ENDPOINT', 'localhost');
  const port = Number(config.get<string>('MINIO_PORT', '9000'));
  const useSSL = config.get<string>('MINIO_USE_SSL') === 'true';
  const bucket = config.get<string>('MINIO_BUCKET', 'generic-saas');
  const scheme = useSSL ? 'https' : 'http';

  return {
    endPoint,
    port,
    useSSL,
    accessKey: config.get<string>('MINIO_ACCESS_KEY', 'admin'),
    secretKey: config.get<string>('MINIO_SECRET_KEY', 'adminadmin'),
    bucket,
    // Si no se configura una URL pública explícita, se deriva del endpoint S3.
    publicUrl: config.get<string>('MINIO_PUBLIC_URL') || `${scheme}://${endPoint}:${port}/${bucket}`,
  };
};
