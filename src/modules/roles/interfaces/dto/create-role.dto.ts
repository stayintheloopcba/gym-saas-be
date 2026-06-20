import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { HierarchyLevel } from '../../../../common/enums/hierarchy-level.enum';

/** Niveles asignables a un rol custom: nunca `GLOBAL` (reservado para platform_admin). */
const ASSIGNABLE_LEVELS = [HierarchyLevel.SELF, HierarchyLevel.ORGANIZATION];

export class CreateRoleDto {
  @ApiProperty({ example: 'Editor', minLength: 1, maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({ required: false, maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiProperty({ enum: ASSIGNABLE_LEVELS, example: HierarchyLevel.SELF, description: '1=SELF, 5=ORGANIZATION' })
  @IsIn(ASSIGNABLE_LEVELS)
  hierarchyLevel: HierarchyLevel;
}
