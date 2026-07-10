import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Member } from './domain/member.entity';
import { MEMBER_REPOSITORY } from './domain/member.repository';
import { TypeOrmMemberRepository } from './infrastructure/typeorm-member.repository';

/**
 * Módulo de members (capas DDD: domain / infrastructure). La capa de
 * aplicación/interfaces (CRUD, role-change, grant-portal-access) se agrega en
 * tareas posteriores de la migración; este módulo por ahora solo expone el
 * port de persistencia para que `gyms` (unit of work) y `permissions` (RBAC)
 * lo consuman sin depender de TypeORM.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Member])],
  providers: [{ provide: MEMBER_REPOSITORY, useClass: TypeOrmMemberRepository }],
  exports: [MEMBER_REPOSITORY],
})
export class MembersModule {}
