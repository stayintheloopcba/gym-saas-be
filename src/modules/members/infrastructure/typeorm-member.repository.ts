import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member } from '../domain/member.entity';
import { MemberRepository } from '../domain/member.repository';

/** Implementación TypeORM del port `MemberRepository`. */
@Injectable()
export class TypeOrmMemberRepository implements MemberRepository {
  constructor(@InjectRepository(Member) private readonly repo: Repository<Member>) {}

  findById(gymId: string, id: string): Promise<Member | null> {
    return this.repo.findOne({ where: { id, gymId } });
  }

  findByGymAndUserId(gymId: string, userId: string): Promise<Member | null> {
    return this.repo.findOne({ where: { gymId, userId } });
  }

  findByGymAndDocumentId(gymId: string, documentId: string): Promise<Member | null> {
    return this.repo.findOne({ where: { gymId, documentId } });
  }

  save(member: Member): Promise<Member> {
    return this.repo.save(member);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
