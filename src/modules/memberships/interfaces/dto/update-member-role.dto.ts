import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { MembershipRole } from '../../../../common/enums/membership-role.enum';

/** Roles asignables al cambiar el rol de un miembro: nunca `OWNER` (la transferencia de propiedad es un flujo aparte). */
const ASSIGNABLE_ROLES = [MembershipRole.ADMIN, MembershipRole.MEMBER, MembershipRole.VIEWER];

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: ASSIGNABLE_ROLES, example: MembershipRole.MEMBER })
  @IsIn(ASSIGNABLE_ROLES)
  role: MembershipRole;
}
