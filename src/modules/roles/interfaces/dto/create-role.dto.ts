import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { HierarchyLevel } from '../../../../common/enums/hierarchy-level.enum';

/** Alcance de datos asignable a un rol nuevo: nunca `GLOBAL` (reservado a platform admins). */
const ASSIGNABLE_HIERARCHY_LEVELS = [HierarchyLevel.SELF, HierarchyLevel.GYM];

export class CreateRoleDto {
  @ApiProperty({
    example: 'billing-manager',
    pattern: '^[a-z0-9]+(-[a-z0-9]+)*$',
    description: 'Slug único e inmutable.',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, { message: 'key must be a kebab-case slug (e.g. billing-manager)' })
  key: string;

  @ApiProperty({ example: 'Billing manager' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({ required: false, example: 'Manages billing and invoices' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiProperty({ enum: ASSIGNABLE_HIERARCHY_LEVELS, example: HierarchyLevel.GYM })
  @IsIn(ASSIGNABLE_HIERARCHY_LEVELS)
  hierarchyLevel: HierarchyLevel;
}
