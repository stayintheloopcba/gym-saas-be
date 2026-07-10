import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsIn, IsOptional } from 'class-validator';
import { RenewalMode } from '../../../../common/enums/renewal-mode.enum';
import { SubscriptionStatus } from '../../../../common/enums/subscription-status.enum';

/** Cancelar, y/o cambiar `renewalMode`/`endDate`. El único status asignable acá es `CANCELLED`. */
export class UpdateSubscriptionDto {
  @ApiPropertyOptional({ enum: [SubscriptionStatus.CANCELLED] })
  @IsOptional()
  @IsIn([SubscriptionStatus.CANCELLED])
  status?: SubscriptionStatus.CANCELLED;

  @ApiPropertyOptional({ enum: RenewalMode })
  @IsOptional()
  @IsEnum(RenewalMode)
  renewalMode?: RenewalMode;

  @ApiPropertyOptional({ type: String, format: 'date', nullable: true })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
