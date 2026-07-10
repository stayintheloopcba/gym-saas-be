import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GymSettings } from '../domain/gym-settings.entity';
import { GymSettingsRepository } from '../domain/gym-settings.repository';

@Injectable()
export class TypeOrmGymSettingsRepository implements GymSettingsRepository {
  constructor(@InjectRepository(GymSettings) private readonly repo: Repository<GymSettings>) {}

  findByGymId(gymId: string): Promise<GymSettings | null> {
    return this.repo.findOne({ where: { gymId } });
  }

  save(settings: GymSettings): Promise<GymSettings> {
    return this.repo.save(settings);
  }
}
