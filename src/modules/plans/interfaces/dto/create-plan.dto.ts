import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class CreatePlanDto {
  @ApiProperty({ example: 'Full access' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 15000 })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiProperty({ example: 'ARS' })
  @IsString()
  @MaxLength(8)
  currency: string;

  @ApiProperty({ enum: Periodicity })
  @IsEnum(Periodicity)
  periodicity: Periodicity;

  @ApiPropertyOptional({ description: 'null/omitted = unlimited', minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  visitsPerMonth?: number;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  timeWindow?: Record<string, unknown>;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiProperty({ type: String, isArray: true, format: 'uuid', description: 'At least one branch is required' })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  branchIds: string[];

  @ApiProperty({ type: String, isArray: true, format: 'uuid' })
  @IsArray()
  @IsUUID('4', { each: true })
  disciplineIds: string[];
}
