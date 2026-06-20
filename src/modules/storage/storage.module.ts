import { Module } from '@nestjs/common';
import { ImageUploadValidator } from './application/image-upload.validator';
import { FILE_STORAGE } from './domain/file-storage.port';
import { MinioFileStorage } from './infrastructure/minio-file-storage';

/**
 * Módulo de almacenamiento de archivos (S3-compatible / MinIO).
 *
 * Expone el port `FileStorage` (token `FILE_STORAGE`) con el adapter MinIO y la
 * validación reutilizable de imágenes, para que los módulos de organizaciones y
 * usuarios provisionen las subidas de logo/banner/avatar (Fase B).
 */
@Module({
  providers: [{ provide: FILE_STORAGE, useClass: MinioFileStorage }, ImageUploadValidator],
  exports: [FILE_STORAGE, ImageUploadValidator],
})
export class StorageModule {}
