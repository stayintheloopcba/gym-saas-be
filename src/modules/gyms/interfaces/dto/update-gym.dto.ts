import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Actualización parcial de un gym: solo `name`. El branding y los campos
 * operativos se editan vía `PUT /gyms/:id/settings` (Decision #4 técnica).
 */
export class UpdateGymDto {
  @ApiPropertyOptional({ example: 'Acme Corporation', minLength: 1, maxLength: 255 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;
}
