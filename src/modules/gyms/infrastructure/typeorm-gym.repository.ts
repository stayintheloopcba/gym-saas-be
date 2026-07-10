import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Gym } from '../domain/gym.entity';
import { GymRepository } from '../domain/gym.repository';

/**
 * Implementación TypeORM del port `GymRepository`.
 *
 * `findOne` respeta `@DeleteDateColumn`, por lo que `findBySlug` solo encuentra
 * slugs de organizaciones activas (clave para reutilizar el slug de una borrada).
 */
@Injectable()
export class TypeOrmGymRepository implements GymRepository {
  constructor(@InjectRepository(Gym) private readonly repo: Repository<Gym>) {}

  findById(id: string): Promise<Gym | null> {
    return this.repo.findOne({ where: { id } });
  }

  findBySlug(slug: string): Promise<Gym | null> {
    return this.repo.findOne({ where: { slug } });
  }

  save(gym: Gym): Promise<Gym> {
    return this.repo.save(gym);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
