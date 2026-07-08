import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class UpdateMemberRoleDto {
  @ApiProperty({ format: 'uuid', description: 'Catalog role id. The owner role cannot be assigned here.' })
  @IsUUID()
  roleId: string;
}
