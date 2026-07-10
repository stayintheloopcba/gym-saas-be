import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from '../domain/branch.entity';
import { BranchRepository } from '../domain/branch.repository';

@Injectable()
export class TypeOrmBranchRepository implements BranchRepository {
  constructor(@InjectRepository(Branch) private readonly repo: Repository<Branch>) {}

  findById(gymId: string, id: string): Promise<Branch | null> {
    return this.repo.findOne({ where: { id, gymId } });
  }

  listByGym(gymId: string): Promise<Branch[]> {
    return this.repo.find({ where: { gymId }, order: { name: 'ASC' } });
  }

  save(branch: Branch): Promise<Branch> {
    return this.repo.save(branch);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
