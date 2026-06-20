import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { HEX_COLOR_REGEX, ORGANIZATION_FONTS } from '../../domain/branding';

/**
 * Actualización parcial de una organización: nombre y/o branding. Todos los campos
 * son opcionales; el use case aplica solo los provistos. Sustituye al antiguo
 * `RenameOrganizationDto` (renombrar es ahora un update con solo `name`).
 */
export class UpdateOrganizationDto {
  @ApiPropertyOptional({ example: 'Acme Corporation', minLength: 1, maxLength: 255 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: '#0F62FE', description: 'Hex color #RRGGBB' })
  @IsOptional()
  @Matches(HEX_COLOR_REGEX, { message: 'primaryColor must be a hex color like #RRGGBB' })
  primaryColor?: string;

  @ApiPropertyOptional({ example: '#161616', description: 'Hex color #RRGGBB' })
  @IsOptional()
  @Matches(HEX_COLOR_REGEX, { message: 'secondaryColor must be a hex color like #RRGGBB' })
  secondaryColor?: string;

  @ApiPropertyOptional({ enum: ORGANIZATION_FONTS })
  @IsOptional()
  @IsIn(ORGANIZATION_FONTS as unknown as string[])
  fontFamily?: string;
}
