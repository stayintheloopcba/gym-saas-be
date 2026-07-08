import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/domain/user.entity';

/**
 * Marca `isPlatformAdmin = true` en los usuarios cuyo email figura en
 * `PLATFORM_ADMIN_EMAILS` (lista separada por comas). Idempotente: solo
 * actualiza a los usuarios que aún no tienen el flag.
 */
@Injectable()
export class PlatformAdminSeeder implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const emails = this.parseEmails(this.config.get<string>('PLATFORM_ADMIN_EMAILS', ''));
    if (emails.length === 0) {
      return;
    }

    for (const email of emails) {
      const user = await this.users.findOne({ where: { email } });
      if (user && !user.isPlatformAdmin) {
        user.isPlatformAdmin = true;
        await this.users.save(user);
      }
    }
  }

  private parseEmails(raw: string): string[] {
    return raw
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter((email) => email.length > 0);
  }
}
