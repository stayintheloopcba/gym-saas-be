import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, ValidateNested } from 'class-validator';
import { AssignPermissionDto } from './assign-permission.dto';

export class BulkAssignPermissionsDto {
  @ApiProperty({ type: AssignPermissionDto, isArray: true })
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => AssignPermissionDto)
  permissions: AssignPermissionDto[];
}
