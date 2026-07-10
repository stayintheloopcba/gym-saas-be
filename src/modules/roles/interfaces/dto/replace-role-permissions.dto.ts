import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsString } from 'class-validator';

export class ReplaceRolePermissionsDto {
  @ApiProperty({ type: String, isArray: true, example: ['gym:read', 'members:read'] })
  @IsArray()
  @ArrayMaxSize(200)
  @IsString({ each: true })
  permissionCodes: string[];
}
