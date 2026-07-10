import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { HierarchyLevel } from '../../../../common/enums/hierarchy-level.enum';

const ASSIGNABLE_HIERARCHY_LEVELS = [HierarchyLevel.SELF, HierarchyLevel.GYM];

/** `key` no es editable: no forma parte de este DTO a propósito. */
export class UpdateRoleDto {
  @ApiPropertyOptional({ minLength: 1, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({ enum: ASSIGNABLE_HIERARCHY_LEVELS, description: '1=SELF, 5=GYM' })
  @IsOptional()
  @IsIn(ASSIGNABLE_HIERARCHY_LEVELS)
  hierarchyLevel?: HierarchyLevel;
}
