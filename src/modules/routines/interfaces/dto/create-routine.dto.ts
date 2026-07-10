import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RoutineScope } from '../../../../common/enums/routine-scope.enum';
import { RoutineItemDto } from './routine-item.dto';

export class CreateRoutineDto {
  @ApiProperty({ enum: RoutineScope })
  @IsEnum(RoutineScope)
  scope: RoutineScope;

  @ApiPropertyOptional({ format: 'uuid', description: 'Required when scope=PERSONAL; forbidden when scope=TEMPLATE' })
  @IsOptional()
  @IsUUID()
  ownerMemberId?: string;

  @ApiProperty({ example: 'Push day' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  notes?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiProperty({ type: RoutineItemDto, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoutineItemDto)
  items: RoutineItemDto[];
}
