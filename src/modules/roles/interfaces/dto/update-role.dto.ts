import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { HierarchyLevel } from '../../../../common/enums/hierarchy-level.enum';

const ASSIGNABLE_LEVELS = [HierarchyLevel.SELF, HierarchyLevel.ORGANIZATION];

export class UpdateRoleDto {
  @ApiPropertyOptional({ minLength: 1, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ maxLength: 255, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({ enum: ASSIGNABLE_LEVELS, description: '1=SELF, 5=ORGANIZATION' })
  @IsOptional()
  @IsIn(ASSIGNABLE_LEVELS)
  hierarchyLevel?: HierarchyLevel;
}
