import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client as MinioClient } from 'minio';
import { buildStorageConfig, StorageConfig } from '../../../config/storage.config';
import { FileStorage, StorableFile } from '../domain/file-storage.port';

/**
 * Adapter de `FileStorage` sobre MinIO (S3-compatible).
 *
 * Al arrancar (`onModuleInit`) asegura la existencia del bucket y le aplica una
 * política de **lectura pública** (los logos/banners/avatares no son sensibles y
 * se sirven por URL directa; ver Decision 4 del design). La escritura siempre pasa
 * por el backend autenticado con las credenciales root.
 */
@Injectable()
export class MinioFileStorage implements FileStorage, OnModuleInit {
  private readonly logger = new Logger(MinioFileStorage.name);
  private readonly config: StorageConfig;
  private readonly client: MinioClient;

  constructor(configService: ConfigService) {
    this.config = buildStorageConfig(configService);
    this.client = new MinioClient({
      endPoint: this.config.endPoint,
      port: this.config.port,
      useSSL: this.config.useSSL,
      accessKey: this.config.accessKey,
      secretKey: this.config.secretKey,
    });
  }

  async onModuleInit(): Promise<void> {
    const { bucket } = this.config;
    const exists = await this.client.bucketExists(bucket).catch(() => false);
    if (!exists) {
      await this.client.makeBucket(bucket);
      this.logger.log(`Created MinIO bucket "${bucket}"`);
    }
    await this.client.setBucketPolicy(bucket, this.publicReadPolicy(bucket));
    this.logger.log(`MinIO storage ready (bucket "${bucket}", public read)`);
  }

  async put(file: StorableFile): Promise<string> {
    await this.client.putObject(this.config.bucket, file.key, file.buffer, file.buffer.length, {
      'Content-Type': file.contentType,
    });
    return `${this.config.publicUrl}/${file.key}`;
  }

  /** Política S3 que permite `GetObject` anónimo sobre el bucket completo. */
  private publicReadPolicy(bucket: string): string {
    return JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${bucket}/*`],
        },
      ],
    });
  }
}
