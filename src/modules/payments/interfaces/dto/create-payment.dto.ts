import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNumber, IsObject, IsOptional, IsPositive, IsUUID } from 'class-validator';
import { PaymentMethod } from '../../../../common/enums/payment-method.enum';

export class CreatePaymentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  memberId: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  subscriptionId?: string;

  @ApiProperty({ example: 45000 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({ type: String, format: 'date' })
  @IsDateString()
  periodStart: string;

  @ApiProperty({ type: String, format: 'date' })
  @IsDateString()
  periodEnd: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  lateFee?: number;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
