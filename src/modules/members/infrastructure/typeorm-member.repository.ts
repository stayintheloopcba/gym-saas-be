import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../permissions/domain/role.entity';
import { Member } from '../domain/member.entity';
import { MemberListFilters, MemberRepository } from '../domain/member.repository';

/** Implementación TypeORM del port `MemberRepository`. */
@Injectable()
export class TypeOrmMemberRepository implements MemberRepository {
  constructor(
    @InjectRepository(Member) private readonly repo: Repository<Member>,
    @InjectRepository(Role) private readonly roles: Repository<Role>,
  ) {}

  findById(gymId: string, id: string): Promise<Member | null> {
    return this.repo.findOne({ where: { id, gymId } });
  }

  findByGymAndUserId(gymId: string, userId: string): Promise<Member | null> {
    return this.repo.findOne({ where: { gymId, userId } });
  }

  findByGymAndDocumentId(gymId: string, documentId: string): Promise<Member | null> {
    return this.repo.findOne({ where: { gymId, documentId } });
  }

  findByUserId(userId: string): Promise<Member[]> {
    return this.repo.find({ where: { userId } });
  }

  async list(gymId: string, filters: MemberListFilters): Promise<Member[]> {
    const qb = this.repo.createQueryBuilder('member').where('member.gym_id = :gymId', { gymId });

    if (filters.status) {
      qb.andWhere('member.status = :status', { status: filters.status });
    }
    if (filters.branchId) {
      qb.andWhere('member.branch_id = :branchId', { branchId: filters.branchId });
    }
    if (filters.roleKey) {
      const role = await this.roles.findOne({ where: { key: filters.roleKey } });
      qb.andWhere('member.role_id = :roleId', { roleId: role?.id ?? null });
    }
    if (filters.search) {
      qb.andWhere(
        '(member.first_name ILIKE :search OR member.last_name ILIKE :search OR ' +
          'member.document_id ILIKE :search OR member.email ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    return qb.orderBy('member.last_name', 'ASC').addOrderBy('member.first_name', 'ASC').getMany();
  }

  countByRoleInGym(gymId: string, roleId: string): Promise<number> {
    return this.repo.count({ where: { gymId, roleId } });
  }

  countByRole(roleId: string): Promise<number> {
    return this.repo.count({ where: { roleId } });
  }

  save(member: Member): Promise<Member> {
    return this.repo.save(member);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
