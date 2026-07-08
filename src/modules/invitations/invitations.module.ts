import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembershipsModule } from '../memberships/memberships.module';
import { UsersModule } from '../users/users.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { AcceptInvitationUseCase } from './application/accept-invitation.use-case';
import { CreateInvitationUseCase } from './application/create-invitation.use-case';
import { DeclineInvitationUseCase } from './application/decline-invitation.use-case';
import { INVITATION_UNIT_OF_WORK } from './application/invitation-unit-of-work.port';
import { ListMyInvitationsUseCase, ListPendingInvitationsUseCase } from './application/list-invitations.use-cases';
import { RevokeInvitationUseCase } from './application/revoke-invitation.use-case';
import { Invitation } from './domain/invitation.entity';
import { INVITATION_REPOSITORY } from './domain/invitation.repository';
import { TypeOrmInvitationUnitOfWork } from './infrastructure/typeorm-invitation-unit-of-work';
import { TypeOrmInvitationRepository } from './infrastructure/typeorm-invitation.repository';
import { InvitationsController } from './interfaces/invitations.controller';

/**
 * Módulo de invitaciones (capas DDD). Importa memberships, permisos y
 * `UsersModule` (`FindUserByEmailUseCase`). Exporta
 * `ListMyInvitationsUseCase` para el onboarding-status de organizations.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Invitation]), MembershipsModule, UsersModule, PermissionsModule],
  controllers: [InvitationsController],
  providers: [
    { provide: INVITATION_REPOSITORY, useClass: TypeOrmInvitationRepository },
    { provide: INVITATION_UNIT_OF_WORK, useClass: TypeOrmInvitationUnitOfWork },
    CreateInvitationUseCase,
    ListPendingInvitationsUseCase,
    ListMyInvitationsUseCase,
    RevokeInvitationUseCase,
    AcceptInvitationUseCase,
    DeclineInvitationUseCase,
  ],
  exports: [ListMyInvitationsUseCase, INVITATION_REPOSITORY],
})
export class InvitationsModule {}
