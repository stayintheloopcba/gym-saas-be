import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RoutineItemDto } from './routine-item.dto';

/** No permite cambiar `scope`/`ownerMemberId` (son fijos al crear); `items` reemplaza el set completo si se provee. */
export class UpdateRoutineDto {
  @ApiPropertyOptional({ example: 'Push day' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ type: RoutineItemDto, isArray: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoutineItemDto)
  items?: RoutineItemDto[];
}
