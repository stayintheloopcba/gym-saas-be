import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** Actualización parcial del perfil propio. */
export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Ada Lovelace', minLength: 1, maxLength: 255 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;
}
