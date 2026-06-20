import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString, MaxLength, MinLength } from 'class-validator';

/** Override de un permiso a nivel usuario (sin cambiar su rol). */
export class AssignMemberPermissionDto {
  @ApiProperty({ example: 'members:invite', maxLength: 120 })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  permissionCode: string;

  @ApiProperty({ example: true, description: 'true = allow, false = deny explícito' })
  @IsBoolean()
  value: boolean;
}
