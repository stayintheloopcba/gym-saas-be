import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { AuthContextMiddleware } from './common/context/auth-context.middleware';
import { buildTypeOrmConfig } from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { MembersModule } from './modules/members/members.module';
import { BranchesModule } from './modules/branches/branches.module';
import { DisciplinesModule } from './modules/disciplines/disciplines.module';
import { GymSettingsModule } from './modules/gym-settings/gym-settings.module';
import { GymsModule } from './modules/gyms/gyms.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { PlatformAdminModule } from './modules/platform-admin/platform-admin.module';
import { RolesModule } from './modules/roles/roles.module';
import { StorageModule } from './modules/storage/storage.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => buildTypeOrmConfig(config),
    }),
    // Rate limiting: límites por endpoint se sobreescriben con @Throttle().
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    CommonModule,
    HealthModule,
    UsersModule,
    AuthModule,
    PermissionsModule,
    PlatformAdminModule,
    MembersModule,
    RolesModule,
    GymsModule,
    GymSettingsModule,
    BranchesModule,
    DisciplinesModule,
    StorageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Puebla authContextStorage en cada request a partir de la cookie de acceso.
    consumer.apply(AuthContextMiddleware).forRoutes('*');
  }
}
