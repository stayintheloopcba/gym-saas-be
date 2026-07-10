import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Periodicity } from '../../../../common/enums/periodicity.enum';

export class UpdatePlanDto {
  @ApiPropertyOptional({ example: 'Full access' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: 15000 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  price?: number;

  @ApiPropertyOptional({ example: 'ARS' })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  @ApiPropertyOptional({ enum: Periodicity })
  @IsOptional()
  @IsEnum(Periodicity)
  periodicity?: Periodicity;

  @ApiPropertyOptional({ description: 'null = unlimited', minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  visitsPerMonth?: number;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  timeWindow?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ type: String, isArray: true, format: 'uuid', description: 'At least one branch is required' })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  branchIds?: string[];

  @ApiPropertyOptional({ type: String, isArray: true, format: 'uuid' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  disciplineIds?: string[];
}
