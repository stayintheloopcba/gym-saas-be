import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/domain/user.entity';
import { UsersModule } from '../users/users.module';
import { PlatformAdminSeeder } from './infrastructure/platform-admin.seeder';
import { PlatformAdminGuard } from './interfaces/platform-admin.guard';

/**
 * Categoría de usuario SUPER_ADMIN: guard para `/admin/*` y seed inicial desde
 * `PLATFORM_ADMIN_EMAILS`. Totalmente desacoplado de memberships/organizaciones.
 */
@Module({
  imports: [TypeOrmModule.forFeature([User]), UsersModule],
  providers: [PlatformAdminGuard, PlatformAdminSeeder],
  exports: [PlatformAdminGuard],
})
export class PlatformAdminModule {}
