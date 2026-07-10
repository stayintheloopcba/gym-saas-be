import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { RenewalMode } from '../../../../common/enums/renewal-mode.enum';

export class CreateSubscriptionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  memberId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  planId: string;

  @ApiPropertyOptional({ type: String, format: 'date', description: 'Defaults to today' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ type: String, format: 'date', nullable: true, description: 'null/omitted = open-ended' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: RenewalMode, default: RenewalMode.MANUAL })
  @IsOptional()
  @IsEnum(RenewalMode)
  renewalMode?: RenewalMode;
}
