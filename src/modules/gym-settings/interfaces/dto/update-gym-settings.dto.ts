import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PaymentMethod } from '../../../../common/enums/payment-method.enum';
import { GYM_FONTS, HEX_COLOR_REGEX } from '../../domain/branding';

/** `PUT /gyms/:id/settings`: reemplazo completo de la configuración del gym. */
export class UpdateGymSettingsDto {
  @ApiPropertyOptional({ example: 'Acme Gym' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  displayName?: string;

  @ApiPropertyOptional({ example: '#0F62FE' })
  @IsOptional()
  @Matches(HEX_COLOR_REGEX, { message: 'primaryColor must be a hex color like #RRGGBB' })
  primaryColor?: string;

  @ApiPropertyOptional({ example: '#161616' })
  @IsOptional()
  @Matches(HEX_COLOR_REGEX, { message: 'secondaryColor must be a hex color like #RRGGBB' })
  secondaryColor?: string;

  @ApiPropertyOptional({ enum: GYM_FONTS })
  @IsOptional()
  @IsIn(GYM_FONTS as unknown as string[])
  fontFamily?: string;

  @ApiPropertyOptional({ example: 'light' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  theme?: string;

  @ApiProperty({ example: 'America/Argentina/Buenos_Aires' })
  @IsString()
  timezone: string;

  @ApiProperty({ example: 'ARS' })
  @IsString()
  @MaxLength(8)
  currency: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  openingHours?: Record<string, unknown>;

  @ApiPropertyOptional({ format: 'email' })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(32)
  contactPhone?: string;

  @ApiProperty({ example: 5, minimum: 0 })
  @IsNumber()
  @Min(0)
  moraGraceDays: number;

  @ApiProperty({ example: 0, minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  moraSurchargePct: number;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  renewalPolicy?: Record<string, unknown>;

  @ApiProperty({ enum: PaymentMethod, isArray: true, example: [PaymentMethod.CASH] })
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(PaymentMethod, { each: true })
  enabledPaymentMethods: PaymentMethod[];
}
