import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsUUID, MaxLength } from 'class-validator';

export class CreateInvitationDto {
  @ApiProperty({ example: 'member@example.com', format: 'email', maxLength: 320 })
  @IsEmail()
  @MaxLength(320)
  email: string;

  @ApiProperty({ format: 'uuid', description: 'Catalog role id. The owner role cannot be invited.' })
  @IsUUID()
  roleId: string;
}
