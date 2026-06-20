import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString, MaxLength, MinLength } from 'class-validator';

export class AssignPermissionDto {
  @ApiProperty({ example: 'resources:update', maxLength: 120 })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  permissionCode: string;

  @ApiProperty({ example: true, description: 'true = allow, false = deny explícito' })
  @IsBoolean()
  value: boolean;
}
