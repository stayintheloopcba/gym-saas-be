import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

/**
 * Construye la configuración de TypeORM a partir de variables de entorno.
 *
 * - `autoLoadEntities`: registra automáticamente las entidades declaradas con
 *   `TypeOrmModule.forFeature([...])` en cada módulo de feature.
 * - `synchronize`: solo en desarrollo (`DB_SYNCHRONIZE=true`). En producción
 *   SIEMPRE debe ser false y usarse migraciones.
 */
export const buildTypeOrmConfig = (config: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: config.get<string>('DB_HOST', 'localhost'),
  port: Number(config.get<string>('DB_PORT', '5432')),
  username: config.get<string>('DB_USER', 'postgres'),
  password: config.get<string>('DB_PASSWORD', 'postgres'),
  database: config.get<string>('DB_NAME', 'generic_saas'),
  autoLoadEntities: true,
  synchronize: config.get<string>('DB_SYNCHRONIZE') === 'true',
  ssl: config.get<string>('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
});
