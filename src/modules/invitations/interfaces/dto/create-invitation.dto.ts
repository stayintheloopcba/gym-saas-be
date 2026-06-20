import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, MaxLength } from 'class-validator';
import { MembershipRole } from '../../../../common/enums/membership-role.enum';

/** Roles que se pueden asignar al invitar: nunca `OWNER` (invariante de único owner). */
const INVITABLE_ROLES = [MembershipRole.ADMIN, MembershipRole.MEMBER, MembershipRole.VIEWER];

export class CreateInvitationDto {
  @ApiProperty({ example: 'member@example.com', format: 'email', maxLength: 320 })
  @IsEmail()
  @MaxLength(320)
  email: string;

  @ApiProperty({ enum: INVITABLE_ROLES, example: MembershipRole.MEMBER })
  @IsIn(INVITABLE_ROLES)
  role: MembershipRole;
}
