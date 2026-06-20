import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../domain/user.entity';
import { UserRepository } from '../domain/user.repository';

/**
 * Implementación TypeORM del port `UserRepository`.
 *
 * `Repository.findOne` respeta `@DeleteDateColumn`, por lo que las búsquedas
 * excluyen automáticamente los usuarios soft-deleted.
 */
@Injectable()
export class TypeOrmUserRepository implements UserRepository {
  constructor(@InjectRepository(User) private readonly repo: Repository<User>) {}

  findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  findByGoogleId(googleId: string): Promise<User | null> {
    return this.repo.findOne({ where: { googleId } });
  }

  save(user: User): Promise<User> {
    return this.repo.save(user);
  }
}
