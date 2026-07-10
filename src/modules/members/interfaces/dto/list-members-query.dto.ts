import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { MemberStatus } from '../../domain/member-status.enum';

const FILTERABLE_STATUSES = Object.values(MemberStatus);

export class ListMembersQueryDto {
  @ApiPropertyOptional({ enum: FILTERABLE_STATUSES })
  @IsOptional()
  @IsIn(FILTERABLE_STATUSES)
  status?: MemberStatus;

  @ApiPropertyOptional({ example: 'instructor', description: 'Role catalog key' })
  @IsOptional()
  @IsString()
  roleKey?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Free-text search over name/document/email' })
  @IsOptional()
  @IsString()
  search?: string;
}
