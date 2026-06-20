import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class GetMatrixQueryDto {
  @ApiPropertyOptional({ description: 'Filtra por recurso (prefijo del código, p. ej. "resources").' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  resource?: string;
}
